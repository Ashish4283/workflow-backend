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
        """Builds engine using URI-encoded credentials to handle special characters like '@'"""
        if self.engine is None:
            password = os.getenv("DB_PASSWORD") or os.getenv("DB_PASS")
            
            if not password:
                raise ValueError("DB_PASSWORD not found")
            
            # --- CRITICAL FIX: URL Encode the password to handle the '@' symbol ---
            safe_password = urllib.parse.quote_plus(password)
            host = os.getenv("DB_HOST", self.db_host)
            user = os.getenv("DB_USER", self.db_user)
            name = os.getenv("DB_NAME", self.db_name)
            
            # Use the encoded password in the connection string
            db_url = f"mysql+mysqlconnector://{user}:{safe_password}@{host}/{name}"
            
            print(f"📡 Dialing {host} (URI-Encoded Safe Connection)...")
            self.engine = create_engine(
                db_url, 
                pool_size=10, 
                max_overflow=5, 
                pool_recycle=3600,
                connect_args={'connect_timeout': 10} # 10s timeout for better feedback
            )
            
        return self.engine

    def harmonize_schema(self):
        """Init TradeMaster tables once connection is verified"""
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
                
                # Check column for user isolation
                res = conn.execute(text("SHOW COLUMNS FROM tm_settings LIKE 'user_id'")).fetchone()
                if not res:
                    try: conn.execute(text("ALTER TABLE tm_settings DROP PRIMARY KEY"))
                    except: pass
                    conn.execute(text("ALTER TABLE tm_settings ADD COLUMN user_id INT NOT NULL FIRST"))
                    conn.execute(text("ALTER TABLE tm_settings ADD PRIMARY KEY (user_id, setting_key)"))

                # Utility tables
                conn.execute(text("CREATE TABLE IF NOT EXISTS tm_strategy_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, log_level VARCHAR(20), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;"))
                conn.execute(text("CREATE TABLE IF NOT EXISTS tm_trades (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, symbol VARCHAR(50), strategy_name VARCHAR(100), type VARCHAR(20), status VARCHAR(20), entry_price DECIMAL(18, 4), exit_price DECIMAL(18, 4), qty INT, pnl DECIMAL(18, 4), entry_time DATETIME, exit_time DATETIME, metadata TEXT) ENGINE=InnoDB;"))
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
            print(f"Google Auth Error: {e}")
            return {"error": str(e)}

    def verify_token(self, token):
        try:
            secret = self.jwt_secret or os.getenv("JWT_SECRET")
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            return payload
        except Exception as e:
            return {"error": str(e)}

db_middleware = DBMiddleware()