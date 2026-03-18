import os
import json
import asyncio
import urllib.parse
from typing import List, Optional
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from db_middleware import db_middleware
from tm_engine.market_simulator import MarketSimulator
from sqlalchemy import text

# Fast API App setup
app = FastAPI(title="TradeMaster Unified Backend")

# --- CONSOLIDATED CORS HANDLER ---
@app.middleware("http")
async def universal_cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return JSONResponse(content="OK", status_code=204, headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Allow-Credentials": "true"
        })
    else:
        try:
            response = await call_next(request)
        except Exception as e:
            print(f"🔥 Server Error: {e}")
            response = JSONResponse(
                content={"status": "error", "message": "Internal Server Error", "details": str(e)},
                status_code=500
            )
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# --- DATABASE STARTUP ---
@app.on_event("startup")
async def startup_event():
    print("💎 Platform Engine Powering Up...")
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, db_middleware.harmonize_schema)
    except Exception as e:
        print(f"⚠️ Startup DB warning: {e}")

# --- AUTH HELPER (FIXED) ---
async def get_current_user_id(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            loop = asyncio.get_event_loop()
            user_info = await loop.run_in_executor(None, db_middleware.verify_token, token)
            # --- FIX: Changed 'user_payload' to 'user_info' ---
            if "id" in user_info:
                return user_info["id"]
            
            g_info = await loop.run_in_executor(None, db_middleware.verify_google_token, token)
            if "sub" in g_info:
                return abs(hash(g_info["sub"])) % 1000000
        except:
            pass
    return 0

# --- ROUTES ---
@app.get("/")
async def root():
    return {"status": "TradeMaster Online", "timestamp": datetime.now().isoformat()}

@app.get("/api/db-check")
async def db_check():
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: db_middleware.execute_query("SELECT 1").fetchone())
        return {"status": "connected", "can_reach_mysql": True if result else False}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/tm/settings")
async def get_tm_settings(request: Request):
    user_id = await get_current_user_id(request)
    try:
        loop = asyncio.get_event_loop()
        rows = await loop.run_in_executor(None, lambda: db_middleware.execute_query(
            "SELECT setting_key, setting_value FROM tm_settings WHERE user_id = :uid", 
            {"uid": user_id}
        ).fetchall())
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
        def save_logic():
            with db_middleware._get_engine().begin() as conn:
                for key, val in settings_to_save.items():
                    conn.execute(text("""
                        INSERT INTO tm_settings (user_id, setting_key, setting_value)
                        VALUES (:uid, :key, :val)
                        ON DUPLICATE KEY UPDATE setting_value = :val
                    """), {"uid": user_id, "key": key, "val": str(val)})
                    
        await loop.run_in_executor(None, save_logic)
        return {"status": "success", "user_id": user_id}
    except Exception as e:
        print(f"Save Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    market = MarketSimulator()
    try:
        while True:
            data = market.get_tick()
            await websocket.send_json({"type": "market_feed", "symbol": "SENSEX", "price": data["price"], "change": data["change"]})
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
