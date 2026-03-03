import os
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import bcrypt
from db_middleware import db_middleware  # Import our new middleware

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow React frontend to communicate with this backend

def get_auth_token():
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return auth_header.split(" ")[1]
    return None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Python Backend with Throttled Middleware is running"}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Missing email or password"}), 400

    email = data['email']
    password = data['password']

    try:
        # Use middleware for pooled connection
        query = "SELECT id, email, role, name, status, subscription_tier, usage_balance, password FROM users WHERE email = :email"
        result = db_middleware.execute_query(query, {"email": email}).mappings().fetchone()

        if result:
            user = dict(result)
            stored_password = user.get('password')
            
            # 1. Try verifying as a bcrypt hash
            if stored_password:
                try:
                    if bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
                        user.pop('password', None) # Safely remove password
                        return jsonify({"message": "Login successful", "user": user}), 200
                except (ValueError, TypeError):
                    # 2. Fallback: Plain text check
                    if stored_password == password:
                        user.pop('password', None)
                        return jsonify({"message": "Login successful", "user": user}), 200
            
            return jsonify({"error": "Invalid credentials"}), 401
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-result', methods=['POST'])
def process_result():
    """Example of a high-concurrency route using batch writing with usage guards."""
    token = get_auth_token()
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    # Stateless verification (No DB hit for signature check)
    user_payload = db_middleware.verify_token(token)
    if "error" in user_payload:
        return jsonify(user_payload), 401

    user_id = user_payload['id']

    # --- MONETIZATION GUARD ---
    # Attempt to decrement usage balance atomically
    permitted, new_balance = db_middleware.check_and_decrement_usage(user_id)
    
    if not permitted:
        return jsonify({
            "error": "Usage Limit Exceeded", 
            "message": "Your current protocol balance is 0. Please upgrade your tier.",
            "code": "LIMIT_REACHED"
        }), 402

    data = request.json
    # Buffer the result for batch writing
    db_middleware.buffer_write("process_logs", {
        "user_id": user_id,
        "result_data": str(data.get('result')),
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

    return jsonify({
        "status": "success", 
        "message": "Reasoning unit consumed successfully",
        "remaining_balance": new_balance
    }), 200

if __name__ == '__main__':
    print(f"Starting High-Concurrency Python Backend on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)
