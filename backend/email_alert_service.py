import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_security_alert(user_data: dict):
    """
    Sends a silent security alert via email when suspicious authentication behavior is detected.
    This function connects to the SMTP server, authenticates securely, sends the email,
    and logs the event.
    """
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_email = os.getenv("SMTP_EMAIL")
        smtp_password = os.getenv("SMTP_PASSWORD")
        admin_email = os.getenv("ADMIN_ALERT_EMAIL", "bharathramu35@gmail.com")

        if not all([smtp_email, smtp_password, admin_email]):
            logger.error("SMTP credentials or Admin email are not fully configured.")
            return

        subject = "SECURITY ALERT: Suspicious Authentication Behavior Detected"
        
        # Format the email body
        body = f"""A suspicious authentication attempt has been detected.

User: {user_data.get('username', 'N/A')}

Risk Score: {user_data.get('risk_score', 'N/A')}

Classification: {user_data.get('classification', 'N/A')}

Typing Anomaly Score: {user_data.get('typing_score', 'N/A')}

Mouse Behavior Score: {user_data.get('mouse_score', 'N/A')}

Facial Stress Score: {user_data.get('face_score', 'N/A')}

IP Address: {user_data.get('ip_address', 'N/A')}

Device: {user_data.get('device_info', 'N/A')}

Browser: {user_data.get('user_agent', 'N/A')}

Timestamp: {user_data.get('timestamp', datetime.utcnow().isoformat())}

Immediate investigation is recommended.
"""
        # Create MIME message
        msg = MIMEMultipart()
        msg['From'] = smtp_email
        msg['To'] = admin_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Connect to SMTP server and send email securely using TLS
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Security alert email sent successfully for user: {user_data.get('username', 'N/A')}")
        
    except Exception as e:
        logger.error(f"Failed to send security alert email: {str(e)}")
