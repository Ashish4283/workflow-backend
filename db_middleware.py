import os
import jwt
import urllib.parse
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()

class DBMiddleware:
    def __init__(self):
        self.engine = None
        # Baseline diagnostics
        self.db_host = os.getenv("DB_HOST", "srv663.hstgr.io")
        self.db_user = os.getenv("DB_USER", "u879603724_creative4ai_us")
        self.db_name = os.getenv("DB_NAME", "u879603724_creative4ai")
        self.jwt_secret = os.getenv("JWT_SECRET")
        self.google_client_id = os.getenv("VITE_GOOGLE_CLIENT_ID")

    def _get_engine(self):
        """Builds engine with pool_pre_ping to automatically repair dropped connections"""
        if self.engine is None:
            password = os.getenv("DB_PASSWORD") or os.getenv("DB_PASS")
            if not password:
                raise ValueError("DB_PASSWORD not found")
            
            safe_password = urllib.parse.quote_plus(password)
            host = os.getenv("DB_HOST", self.db_host)
            user = os.getenv("DB_USER", self.db_user)
            name = os.getenv("DB_NAME", self.db_name)
            
            db_url = f"mysql+mysqlconnector://{user}:{safe_password}@{host}/{name}"
            
            print(f"📡 Dialing {host} (Resilient Pool Enabled)...")
            self.engine = create_engine(
                db_url, 
                pool_size=10, 
                max_overflow=5, 
                pool_recycle=1800, # Recycle connections every 30 mins
                pool_pre_ping=True, # --- CRITICAL: Auto-reconnect if connection dies ---
                connect_args={'connect_timeout': 15}
            )
            
        return self.engine

    def harmonize_schema(self):
        """Initialization logic"""
        try:
            engine = self._get_engine()
            with engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS tm_settings (
                        user_id INT NOT NULL,
                        setting_key VARCHAR(100) NOT NULL,
                        setting_value TEXT,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (user_id, setting_key)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """))
                print("✅ Database Schema Harmonized.")
        except Exception as e:
            print(f"⚠️ Schema initialization delayed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(SQLAlchemyError)
    )
    def execute_query(self, query_str, params=None):
        try:
            engine = self._get_engine()
            with engine.connect() as connection:
                stmt = text(query_str)
                result = connection.execute(stmt, params or {})
                return result
        except Exception as e:
            print(f"DB Query Error: {e}")
            raise e

    def verify_google_token(self, token):
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), self.google_client_id)
            return idinfo
        except Exception as e:
            return {"error": str(e)}

    def verify_token(self, token):
        try:
            secret = self.jwt_secret or os.getenv("JWT_SECRET")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            return payload
        except Exception as e:
            return {"error": str(e)}

db_middleware = DBMiddleware()