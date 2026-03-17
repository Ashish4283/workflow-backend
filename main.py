import os
import datetime
import time
import asyncio
import threading
from fastapi import FastAPI, Request, Response, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import bcrypt
import google.generativeai as genai
from db_middleware import db_middleware
from tm_engine.market_simulator import MarketSimulator
from tm_engine.quantum_momentum import QuantumMomentum

# Load environment variables
load_dotenv()

# --- FASTAPI APP ---
app = FastAPI(title="Consolidated Platform Backend")

# --- WEB_SOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# --- UNIVERSAL CORS & OPTIONS HANDLER (The "No-Fail" Fix) ---
@app.middleware("http")
async def cors_and_preflight_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    # 1. Handle Preflight (OPTIONS)
    if request.method == "OPTIONS":
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    # 2. Handle Actual Request
    response = await call_next(request)
    
    # 3. Attach CORS headers to EVERY response
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        # Optional: Add methods/headers here too if needed by broad browsers
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
    
    return response

# --- DB CONNECTIVITY TEST ---
@app.get('/api/db-check')
async def db_check():
    try:
        # Simple test query
        res = db_middleware.execute_query("SELECT 1").fetchone()
        return {
            "status": "connected",
            "db_host": db_middleware.db_host,
            "can_reach_mysql": True
        }
    except Exception as e:
        return {
            "status": "error",
            "db_host": db_middleware.db_host,
            "error": str(e),
            "hint": "Check if Render IP is whitelisted on Hostinger or if DB_HOST is public."
        }

# --- TRADEMASTER ENGINE POOL ---
engine_pool = {} # user_id -> { engine, simulator, active }
pool_lock = asyncio.Lock() # ASYNC LOCK for event loop harmony

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Harmonize Schema on Startup
@app.on_event("startup")
async def startup_event():
    print("💎 Platform Engine Powering Up...")
    try:
        db_middleware.harmonize_schema()
        asyncio.create_task(engine_broadcast_loop())
        print("✅ Background Loops Latched")
    except Exception as e:
        print(f"❌ Startup Sequence Failed: {e}")

async def get_auth_user(request: Request):
    """Helper to verify Google or Platform token and return user from DB"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(" ")[1]
    
    # Run synchronous checks in thread pool to avoid blocking event loop
    loop = asyncio.get_event_loop()
    user_payload = await loop.run_in_executor(None, db_middleware.verify_google_token, token)
    
    if "error" in user_payload:
        user_payload = await loop.run_in_executor(None, db_middleware.verify_token, token)
    
    if "error" in user_payload:
        print(f"🔐 Auth Failure: {user_payload['error']}")
        return None
        
    email = user_payload.get('email')
    query = "SELECT id, email, name FROM users WHERE email = :email"
    
    # DB call in executor
    result = await loop.run_in_executor(None, lambda: db_middleware.execute_query(query, {"email": email}).mappings().fetchone())
    return dict(result) if result else None

async def get_or_create_engine(user_id):
    async with pool_lock:
        if user_id not in engine_pool:
            engine_pool[user_id] = {
                "engine": QuantumMomentum(),
                "simulator": MarketSimulator(),
                "active": False
            }
        return engine_pool[user_id]

# --- WEB_SOCKET BROADCASTER ---
async def engine_broadcast_loop():
    print("🚀 Quantum Telemetry Loop Started (FastAPI - Native WS)")
    while True:
        try:
            async with pool_lock:
                for user_id, data in list(engine_pool.items()):
                    if data["active"]:
                        tick = data["simulator"].next_tick()
                        signal = data["engine"].process_price(tick["price"])
                        
                        telemetry = {
                            "type": "QUANTUM_TELEMETRY",
                            "price": tick["price"],
                            "time": tick["time"],
                            "isBurst": tick["isBurst"],
                            "signal": signal,
                            "stats": data["engine"].stats
                        }
                        
                        await manager.send_personal_message(telemetry, user_id)
        except Exception as e:
            print(f"Engine Loop Error: {e}")
            
        await asyncio.sleep(1)

# --- NATIVE WEB_SOCKET ENDPOINT ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("🔌 New WebSocket probe...")
    user_id = None
    try:
        # Initial message must be AUTH
        data = await websocket.receive_json()
        if data.get('type') == 'AUTH':
            # In a real app, verify email/token. For now, we trust for simplicity
            user_id_email = data.get('email')
            # Look up user ID from email
            loop = asyncio.get_event_loop()
            user_res = await loop.run_in_executor(None, lambda: db_middleware.execute_query(
                "SELECT id FROM users WHERE email = :email", {"email": user_id_email}
            ).mappings().fetchone())
            
            if user_res:
                user_id = user_res['id']
                await manager.connect(user_id, websocket)
                print(f"✅ WebSocket established for User {user_id}")
                
                # Keep connection alive
                while True:
                    await websocket.receive_text() # Heartbeat/Wait
            else:
                await websocket.close(code=4001)
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(user_id)
            print(f"🔌 WebSocket disconnected for User {user_id}")
    except Exception as e:
        print(f"🔌 WebSocket Error: {e}")
        if websocket:
            try: await websocket.close()
            except: pass

# --- TRADEMASTER API ---
@app.get('/api/tm/status')
async def tm_status(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    state = await get_or_create_engine(user['id'])
    return {
        "active": state["active"],
        "stats": state["engine"].stats
    }

@app.post('/api/tm/toggle')
async def tm_toggle(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    state = await get_or_create_engine(user['id'])
    state["active"] = not state["active"]
    
    return {
        "active": state["active"],
        "msg": "Engine Started" if state["active"] else "Engine Stopped"
    }

@app.get('/api/tm/settings')
async def get_tm_settings(request: Request):
    print("🔗 Fetching Settings...")
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    loop = asyncio.get_event_loop()
    res = await loop.run_in_executor(None, lambda: db_middleware.execute_query(
        "SELECT setting_key, setting_value FROM tm_settings WHERE user_id = :uid",
        {"uid": user['id']}
    ).mappings().fetchall())
    
    return {row['setting_key']: row['setting_value'] for row in res}

@app.post('/api/tm/settings')
async def post_tm_settings(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    data = await request.json()
    loop = asyncio.get_event_loop()
    
    def do_save():
        for key, value in data.items():
            db_middleware.execute_query(
                "REPLACE INTO tm_settings (user_id, setting_key, setting_value) VALUES (:uid, :key, :val)",
                {"uid": user['id'], "key": key, "val": str(value)}
            )
            
    await loop.run_in_executor(None, do_save)
    return {"status": "saved"}

# --- ORIGINAL PLATFORM ROUTES ---
@app.get('/api/health')
async def health_check():
    return {"status": "ok", "message": "Consolidated FastAPI Platform Backend Running"}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post('/api/login')
async def login(req: LoginRequest):
    print(f"🔑 Login Attempt: {req.email}")
    loop = asyncio.get_event_loop()
    try:
        query = "SELECT id, email, role, name, status, subscription_tier, usage_balance, password FROM users WHERE email = :email"
        result = await loop.run_in_executor(None, lambda: db_middleware.execute_query(query, {"email": req.email}).mappings().fetchone())

        if result:
            user = dict(result)
            stored_password = user.get('password')
            if stored_password and (bcrypt.checkpw(req.password.encode('utf-8'), stored_password.encode('utf-8')) or stored_password == req.password):
                user.pop('password', None)
                return {"message": "Login successful", "user": user}
            raise HTTPException(status_code=401, detail="Invalid credentials")
        raise HTTPException(status_code=404, detail="User not found")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"❌ Login Error: {e}")
@app.post('/api/process-result')
async def process_result(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    loop = asyncio.get_event_loop()
    permitted, new_balance = await loop.run_in_executor(None, db_middleware.check_and_decrement_usage, user['id'])
    
    if not permitted:
        raise HTTPException(status_code=402, detail="Usage Limit Exceeded")

    data = await request.json()
    await loop.run_in_executor(None, lambda: db_middleware.buffer_write("process_logs", {
        "user_id": user['id'],
        "result_data": str(data.get('result', '')),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }))
    
    return {"status": "success", "remaining_balance": new_balance}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
