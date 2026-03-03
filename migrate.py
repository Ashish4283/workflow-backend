import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def migrate():
    load_dotenv()
    db_user = os.getenv('DB_USER', 'u879603724_creative4ai_us')
    db_pass = os.getenv('DB_PASSWORD') or os.getenv('DB_PASS')
    db_host = os.getenv('DB_HOST', '127.0.0.1')
    db_name = os.getenv('DB_NAME', 'u879603724_creative4ai')
    
    db_url = f'mysql+mysqlconnector://{db_user}:{db_pass}@{db_host}/{db_name}'
    engine = create_engine(db_url)
    
    with engine.begin() as conn:
        print("Creating user_groups table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_groups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """))
        
        print("Checking for group_id column in users table...")
        check = conn.execute(text("SHOW COLUMNS FROM users LIKE 'group_id'")).fetchone()
        if not check:
            print("Adding group_id column and foreign key constraint...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN group_id INT DEFAULT NULL,
                ADD CONSTRAINT fk_user_group FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE SET NULL;
            """))
        
        print("Checking for existing groups...")
        check_groups = conn.execute(text("SELECT COUNT(*) FROM user_groups")).fetchone()
        if check_groups[0] == 0:
            print("Inserting default 'Global Team' group...")
            conn.execute(text("INSERT INTO user_groups (name, description) VALUES ('Global Team', 'Default group for all users');"))
            
    print("Migration Successful!")

if __name__ == "__main__":
    migrate()
