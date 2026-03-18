import mysql.connector
import os

def check_settings():
    try:
        conn = mysql.connector.connect(
            host="srv663.hstgr.io",
            user="u879603724_creative4ai_us",
            password="StrongPassDB@123",
            database="u879603724_creative4ai"
        )
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tm_settings")
        rows = cursor.fetchall()
        print("--- TM_SETTINGS CONTENT ---")
        for row in rows:
            print(row)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_settings()
