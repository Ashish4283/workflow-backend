import os
import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()

class DBMiddleware:
    def __init__(self):
        self.db_host = os.getenv("DB_HOST", "127.0.0.1")
        self.db_user = os.getenv("DB_USER", "u879603724_creative4ai_us")
        self.db_password = os.getenv("DB_PASSWORD")
        self.db_name = os.getenv("DB_NAME", "u879603724_creative4ai")
        self.jwt_secret = os.getenv("JWT_SECRET")
        
        if not self.db_password:
            raise ValueError("DB_PASSWORD not found in environment variables")
        
        # Create SQLAlchemy engine for connection pooling
        self.db_url = f"mysql+mysqlconnector://{self.db_user}:{self.db_password}@{self.db_host}/{self.db_name}"
        self.engine = create_engine(self.db_url, pool_size=15, max_overflow=5, pool_recycle=3600)
        self.google_client_id = os.getenv("VITE_GOOGLE_CLIENT_ID")

    def harmonize_schema(self):
        """
        Self-healing schema routine for TradeMaster tables.
        """
        print("🔍 Checking TradeMaster database schema health...")
        try:
            with self.engine.begin() as conn:
                # 1. tm_settings
                res = conn.execute(text("SHOW COLUMNS FROM tm_settings LIKE 'user_id'")).fetchone()
                if not res:
                    print("🛠️ Harmonizing tm_settings... adding user_id column.")
                    try: conn.execute(text("ALTER TABLE tm_settings DROP PRIMARY KEY"))
                    except: pass
                    conn.execute(text("ALTER TABLE tm_settings ADD COLUMN user_id INT NOT NULL FIRST"))
                    conn.execute(text("ALTER TABLE tm_settings ADD PRIMARY KEY (user_id, setting_key)"))
                
                # 2. tm_strategy_logs
                res = conn.execute(text("SHOW COLUMNS FROM tm_strategy_logs LIKE 'user_id'")).fetchone()
                if not res:
                    conn.execute(text("ALTER TABLE tm_strategy_logs ADD COLUMN user_id INT NOT NULL"))
                
                # 3. tm_trades
                res = conn.execute(text("SHOW COLUMNS FROM tm_trades LIKE 'user_id'")).fetchone()
                if not res:
                    conn.execute(text("ALTER TABLE tm_trades ADD COLUMN user_id INT NOT NULL"))
                
                print("✅ TradeMaster Schema harmonized.")
        except Exception as e:
            print(f"⚠️ Schema harmonization failed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(SQLAlchemyError)
    )
    def execute_query(self, query_str, params=None):
        """
        Executes a query with built-in retry logic for resilience.
        """
        try:
            with self.engine.connect() as connection:
                stmt = text(query_str)
                result = connection.execute(stmt, params or {})
                return result
        except SQLAlchemyError as e:
            print(f"Resilient DB Error: {e}")
            raise e

    def check_and_decrement_usage(self, user_id):
        """
        Atomic usage guard. Decrements usage_balance if > 0.
        Returns Tuple (bool: permitted, int: new_balance)
        """
        query = """
            UPDATE users 
            SET usage_balance = usage_balance - 1 
            WHERE id = :id AND usage_balance > 0
        """
        try:
            with self.engine.begin() as connection:
                result = connection.execute(text(query), {"id": user_id})
                if result.rowcount > 0:
                    # Fetch new balance
                    bal_query = "SELECT usage_balance FROM users WHERE id = :id"
                    bal_res = connection.execute(text(bal_query), {"id": user_id}).scalar()
                    return True, bal_res
                return False, 0
        except Exception as e:
            print(f"Usage Guard Error: {e}")
            return False, 0

    def verify_token(self, token):
        """
        Verifies a JWT token.
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            return payload
        except jwt.ExpiredSignatureError:
            return {"error": "Token expired"}
        except jwt.InvalidTokenError:
            return {"error": "Invalid token"}

    def verify_google_token(self, token):
        """
        Verifies Google ID Token. Returns payload or error dict.
        """
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), self.google_client_id)
            return idinfo
        except Exception as e:
            print(f"Google Auth Error: {e}")
            return {"error": str(e)}

    def buffer_write(self, table, data):
        """
        Writes data to the database. 
        (Currently direct write, can be upgraded to batching later)
        """
        try:
            columns = ', '.join(data.keys())
            # Create parameter placeholders like :user_id, :result_data
            placeholders = ', '.join([f":{key}" for key in data.keys()])
            
            query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            
            with self.engine.begin() as connection:
                connection.execute(text(query), data)
                
        except Exception as e:
            print(f"Buffer Write Error: {e}")

db_middleware = DBMiddleware()