import sqlite3
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

DB_DIR = "data"
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

DB_PATH = os.getenv("DB_PATH", os.path.join(DB_DIR, "security_logs.db"))

def init_db():
    """Initializes the SQLite database with the required table for security logging."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS security_alert_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            username TEXT,
            risk_score REAL,
            classification TEXT,
            ip_address TEXT,
            device_info TEXT
        )
        ''')
        conn.commit()
        conn.close()
        logger.info("Database initialized with security_alert_logs table")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")

def log_security_alert(user_data: dict):
    """Logs the security alert into the database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO security_alert_logs (
            timestamp, username, risk_score, classification, ip_address, device_info
        ) VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_data.get('timestamp', datetime.utcnow().isoformat()),
            user_data.get('username', 'N/A'),
            user_data.get('risk_score', 0.0),
            user_data.get('classification', 'UNKNOWN'),
            user_data.get('ip_address', 'N/A'),
            user_data.get('device_info', 'N/A')
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"Security alert logged in database for user: {user_data.get('username', 'N/A')}")
    except Exception as e:
        logger.error(f"Failed to log security alert in database: {str(e)}")
