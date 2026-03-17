import os
import datetime
import time
import asyncio
import threading
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from socketio import AsyncServer, ASGIApp
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

# Explicit CORS for Production Security
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://creative4ai.com", 
        "https://tm-api.creative4ai.com",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept"], # Explicitly broad
)

# --- SOCKET.IO ---
sio = AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = ASGIApp(sio, other_asgi_app=app)

# --- TRADEMASTER ENGINE POOL ---
engine_pool = {} # user_id -> { engine, simulator, active }
pool_lock = threading.Lock()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Harmonize Schema on Startup
@app.on_event("startup")
async def startup_event():
    db_middleware.harmonize_schema()
    # Start engine loop automatically
    asyncio.create_task(engine_broadcast_loop())

async def get_auth_user(request: Request):
    """Helper to verify Google or Platform token and return user from DB"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(" ")[1]
    
    user_payload = db_middleware.verify_google_token(token)
    if "error" in user_payload:
        user_payload = db_middleware.verify_token(token)
    
    if "error" in user_payload:
        return None
        
    email = user_payload.get('email')
    query = "SELECT id, email, name FROM users WHERE email = :email"
    user = db_middleware.execute_query(query, {"email": email}).mappings().fetchone()
    return dict(user) if user else None

def get_or_create_engine(user_id):
    with pool_lock:
        if user_id not in engine_pool:
            engine_pool[user_id] = {
                "engine": QuantumMomentum(),
                "simulator": MarketSimulator(),
                "active": False
            }
        return engine_pool[user_id]

# --- BACKGROUND ENGINE LOOP ---
async def engine_broadcast_loop():
    print("🚀 Quantum Telemetry Loop Started (FastAPI)")
    while True:
        try:
            with pool_lock:
                for user_id, data in engine_pool.items():
                    if data["active"]:
                        tick = data["simulator"].next_tick()
                        signal = data["engine"].process_price(tick["price"])
                        
                        # Pack telemetry
                        telemetry = {
                            "type": "QUANTUM_TELEMETRY",
                            "price": tick["price"],
                            "time": tick["time"],
                            "isBurst": tick["isBurst"],
                            "signal": signal,
                            "stats": data["engine"].stats
                        }
                        
                        # Emit to specific room (user_id)
                        await sio.emit('telemetry', telemetry, room=f"user_{user_id}")
        except Exception as e:
            print(f"Engine Loop Error: {e}")
            
        await asyncio.sleep(1) # Frequency: 1Hz

# --- SOCKET EVENTS ---
@sio.on('join')
async def on_join(sid, data):
    user_id = data.get('user_id')
    if user_id:
        sio.enter_room(sid, f"user_{user_id}")
        print(f"User {user_id} joined telemetry room")

# --- TRADEMASTER API ---
@app.get('/api/tm/status')
async def tm_status(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    state = get_or_create_engine(user['id'])
    return {
        "active": state["active"],
        "stats": state["engine"].stats
    }

@app.post('/api/tm/toggle')
async def tm_toggle(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    state = get_or_create_engine(user['id'])
    state["active"] = not state["active"]
    
    return {
        "active": state["active"],
        "msg": "Engine Started" if state["active"] else "Engine Stopped"
    }

@app.get('/api/tm/settings')
async def get_tm_settings(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    res = db_middleware.execute_query(
        "SELECT setting_key, setting_value FROM tm_settings WHERE user_id = :uid",
        {"uid": user['id']}
    ).mappings().fetchall()
    
    return {row['setting_key']: row['setting_value'] for row in res}

@app.post('/api/tm/settings')
async def post_tm_settings(request: Request):
    user = await get_auth_user(request)
    if not user: raise HTTPException(status_code=401, detail="Unauthorized")
    
    data = await request.json()
    for key, value in data.items():
        db_middleware.execute_query(
            "REPLACE INTO tm_settings (user_id, setting_key, setting_value) VALUES (:uid, :key, :val)",
            {"uid": user['id'], "key": key, "val": str(value)}
        )
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
    try:
        query = "SELECT id, email, role, name, status, subscription_tier, usage_balance, password FROM users WHERE email = :email"
        result = db_middleware.execute_query(query, {"email": req.email}).mappings().fetchone()

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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=10000)
