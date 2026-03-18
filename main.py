import os
import json
import asyncio
import urllib.parse
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from db_middleware import db_middleware
from tm_engine.market_simulator import MarketSimulator
from sqlalchemy import text

# Fast API App setup
app = FastAPI(title="TradeMaster Unified Backend")

# --- ENGINE STATE ---
class EngineState:
    def __init__(self):
        self.is_running = False
        self.status = "WANDERING"

engine_state = EngineState()

# --- OFFICIAL STABLE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE STARTUP ---
@app.on_event("startup")
async def startup_event():
    print("💎 Platform Engine Powering Up...")
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, db_middleware.harmonize_schema)
        print("✅ Background Loops Latched")
    except Exception as e:
        print(f"⚠️ Startup DB warning: {e}")

# --- AUTH HELPER (SECURE) ---
async def get_current_user_id(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            loop = asyncio.get_event_loop()
            user_info = await loop.run_in_executor(None, db_middleware.verify_token, token)
            if user_info and "id" in user_info:
                return user_info["id"]
            
            g_info = await loop.run_in_executor(None, db_middleware.verify_google_token, token)
            if g_info and "sub" in g_info:
                return abs(hash(g_info["sub"])) % 1000000
        except:
            pass
    return 0

# --- CORE ROUTES ---
@app.get("/")
async def root():
    return {"status": "TradeMaster Online", "timestamp": datetime.now().isoformat()}

@app.get("/api/db-check")
async def db_check():
    try:
        loop = asyncio.get_event_loop()
        def check():
            with db_middleware._get_engine().connect() as conn:
                return conn.execute(text("SELECT 1")).fetchone()
        
        result = await loop.run_in_executor(None, check)
        return {"status": "connected", "can_reach_mysql": True}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# --- TRADEMASTER SETTINGS ---
@app.get("/api/tm/settings")
async def get_tm_settings(request: Request):
    user_id = await get_current_user_id(request)
    try:
        loop = asyncio.get_event_loop()
        def fetch():
            engine = db_middleware._get_engine()
            with engine.connect() as conn:
                return conn.execute(text(
                    "SELECT setting_key, setting_value FROM tm_settings WHERE user_id = :uid"
                ), {"uid": user_id}).fetchall()
        
        rows = await loop.run_in_executor(None, fetch)
        return {row[0]: row[1] for row in rows}
    except:
        return {}

@app.post("/api/tm/settings")
async def update_tm_settings(request: Request):
    user_id = await get_current_user_id(request)
    try:
        payload = await request.json()
        settings_to_save = payload.get("settings", payload)
        
        loop = asyncio.get_event_loop()
        def save():
            engine = db_middleware._get_engine()
            with engine.begin() as conn:
                for key, val in settings_to_save.items():
                    conn.execute(text("""
                        INSERT INTO tm_settings (user_id, setting_key, setting_value)
                        VALUES (:uid, :key, :val)
                        ON DUPLICATE KEY UPDATE setting_value = :val
                    """), {"uid": user_id, "key": key, "val": str(val)})
        
        await loop.run_in_executor(None, save)
        return {"status": "success"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- ENGINE CONTROL ---
@app.post("/api/tm/toggle")
async def toggle_engine(request: Request):
    user_id = await get_current_user_id(request)
    # Generic toggle for now
    engine_state.is_running = not engine_state.is_running
    engine_state.status = "SCANNING" if engine_state.is_running else "WANDERING"
    return {"isRunning": engine_state.is_running, "status": engine_state.status}

# --- UNIFIED WEBSOCKET (PATH MATCH: /ws) ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("📡 Quantum Link Established")
    market = MarketSimulator()
    try:
        while True:
            # 1. Listen for messages (like AUTH) non-blocking
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                print(f"📥 Received: {msg}")
            except asyncio.TimeoutError:
                pass
            
            # 2. Extract tick from simulator
            # CRITICAL FIX: next_tick() is the correct method name
            tick = market.next_tick()
            
            # 3. Construct the message the frontend expects (QUANTUM_TELEMETRY)
            telemetry = {
                "type": "QUANTUM_TELEMETRY",
                "market": {
                    "sensex": tick["price"],
                    "isBurst": tick["isBurst"]
                },
                "engineStatus": engine_state.status,
                "isRunning": engine_state.is_running,
                "stats": {
                    "volatility": 0.05 if not tick["isBurst"] else 0.85,
                    "confidence": 0.42 if not tick["isBurst"] else 0.95
                },
                "activePositions": []
            }
            
            await websocket.send_json(telemetry)
            await asyncio.sleep(0.5) # Fast telemetry for smooth charts
            
    except WebSocketDisconnect:
        print("📡 Quantum Link Terminated")
    except Exception as e:
        print(f"❌ WebSocket Crash: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
