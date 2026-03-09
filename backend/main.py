from fastapi import FastAPI, BackgroundTasks, Request
from pydantic import BaseModel
import logging
from datetime import datetime
from email_alert_service import send_security_alert
from database import init_db, log_security_alert
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Initialize DB on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Biometric Auth Security Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuthAttemptModel(BaseModel):
    username: str
    password: str
    risk_score: float
    classification: str
    typing_score: float = 0.0
    mouse_score: float = 0.0
    face_score: float = 0.0
    device_info: str = "Unknown Device"

@app.post("/api/auth/login")
async def login(auth_data: AuthAttemptModel, background_tasks: BackgroundTasks, request: Request):
    """
    Mock authentication endpoint that evaluates risk and triggers silent alerts.
    The login response does not wait for the email to be sent, satisfying the requirement.
    """
    
    # Extract client information
    ip_address = request.client.host if request.client else "Unknown IP"
    user_agent = request.headers.get("user-agent", "Unknown Browser")
    timestamp = datetime.utcnow().isoformat()
    
    # Check if security alert needs to be triggered
    # Conditions: risk_score >= 60 OR classification in high risk categories
    high_risk_classifications = ["SUSPICIOUS BEHAVIOR", "HIGH RISK AUTHENTICATION", "CONFIRMED DURESS ATTACK"]
    
    if auth_data.risk_score >= 60 or auth_data.classification in high_risk_classifications:
        # Prepare user data dictionary for the alert task
        user_alert_data = {
            "username": auth_data.username,
            "risk_score": auth_data.risk_score,
            "classification": auth_data.classification,
            "typing_score": auth_data.typing_score,
            "mouse_score": auth_data.mouse_score,
            "face_score": auth_data.face_score,
            "ip_address": ip_address,
            "device_info": auth_data.device_info,
            "user_agent": user_agent,
            "timestamp": timestamp
        }
        
        # Trigger background tasks (non-blocking)
        # This will securely and silently trigger an alert while returning response immediately
        background_tasks.add_task(send_security_alert, user_alert_data)
        background_tasks.add_task(log_security_alert, user_alert_data)
        
        logger.warning(f"High risk authentication detected for {auth_data.username}. Background alert triggered.")
    
    # Mock Auth Logic
    if auth_data.password == "wrong_password":
        return {"status": "error", "message": "Invalid credentials"}
        
    return {
        "status": "success", 
        "message": "Authentication processed", 
        "username": auth_data.username,
        "classification": auth_data.classification
    }
    
@app.get("/")
def read_root():
    return {"message": "Welcome to the Biometric Auth Security Service API. The backend is running successfully!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
