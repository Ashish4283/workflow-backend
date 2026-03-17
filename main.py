import os
import datetime
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
import bcrypt
import google.generativeai as genai
from db_middleware import db_middleware
from tm_engine.market_simulator import MarketSimulator
from tm_engine.quantum_momentum import QuantumMomentum

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Allow requests from Hostinger subdomain and local dev
CORS(app, origins=[
    "https://creative4ai.com", 
    "https://tm-api.creative4ai.com", 
    "http://localhost:5173",
    "http://localhost:3000"
])
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

# --- TRADEMASTER ENGINE POOL ---
engine_pool = {} # user_id -> { engine, simulator, active }
pool_lock = threading.Lock()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Harmonize Schema on Startup
db_middleware.harmonize_schema()

def get_auth_user():
    """Helper to verify Google or Platform token and return user from DB"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(" ")[1]
    
    # Check if it's a Google token or platform token
    # (For simplicity in this transition, we check both)
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
def engine_broadcast_loop():
    print("🚀 Quantum Telemetry Loop Started")
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
                        socketio.emit('telemetry', telemetry, room=f"user_{user_id}")
        except Exception as e:
            print(f"Engine Loop Error: {e}")
            
        time.sleep(1) # Frequency: 1Hz

threading.Thread(target=engine_broadcast_loop, daemon=True).start()

# --- SOCKET EVENTS ---
@socketio.on('join')
def on_join(data):
    # For now, simplistic room joining. 
    # In production, verify token before allowing join.
    user_id = data.get('user_id')
    if user_id:
        from flask_socketio import join_room
        join_room(f"user_{user_id}")
        print(f"User {user_id} joined telemetry room")

# --- TRADEMASTER API ---
@app.route('/api/tm/status', methods=['GET'])
def tm_status():
    user = get_auth_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    state = get_or_create_engine(user['id'])
    return jsonify({
        "active": state["active"],
        "stats": state["engine"].stats
    })

@app.route('/api/tm/toggle', methods=['POST'])
def tm_toggle():
    user = get_auth_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    state = get_or_create_engine(user['id'])
    state["active"] = not state["active"]
    
    return jsonify({
        "active": state["active"],
        "msg": "Engine Started" if state["active"] else "Engine Stopped"
    })

@app.route('/api/tm/settings', methods=['GET', 'POST'])
def tm_settings():
    user = get_auth_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    if request.method == 'POST':
        data = request.json
        for key, value in data.items():
            db_middleware.execute_query(
                "REPLACE INTO tm_settings (user_id, setting_key, setting_value) VALUES (:uid, :key, :val)",
                {"uid": user['id'], "key": key, "val": str(value)}
            )
        return jsonify({"status": "saved"})
    
    # GET
    res = db_middleware.execute_query(
        "SELECT setting_key, setting_value FROM tm_settings WHERE user_id = :uid",
        {"uid": user['id']}
    ).mappings().fetchall()
    
    settings = {row['setting_key']: row['setting_value'] for row in res}
    return jsonify(settings)

# --- ORIGINAL PLATFORM ROUTES ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Consolidated Platform Backend Running"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Missing email or password"}), 400

    email = data['email']
    password = data['password']

    try:
        query = "SELECT id, email, role, name, status, subscription_tier, usage_balance, password FROM users WHERE email = :email"
        result = db_middleware.execute_query(query, {"email": email}).mappings().fetchone()

        if result:
            user = dict(result)
            stored_password = user.get('password')
            if stored_password and (bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')) or stored_password == password):
                user.pop('password', None)
                return jsonify({"message": "Login successful", "user": user}), 200
            return jsonify({"error": "Invalid credentials"}), 401
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-result', methods=['POST'])
def process_result():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_payload = db_middleware.verify_token(token)
    if "error" in user_payload: return jsonify(user_payload), 401
    
    permitted, new_balance = db_middleware.check_and_decrement_usage(user_payload['id'])
    if not permitted: return jsonify({"error": "Limit Exceeded"}), 402

    db_middleware.buffer_write("process_logs", {
        "user_id": user_payload['id'],
        "result_data": str(request.json.get('result')),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    return jsonify({"status": "success", "remaining_balance": new_balance}), 200

if __name__ == '__main__':
    # Use socketio.run instead of app.run for websocket support
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
