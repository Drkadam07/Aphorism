import secrets
import aiosmtplib
from email.message import EmailMessage
from app.config import settings

def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

async def send_otp_email(to_email: str, otp_code: str):
    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to_email
    message["Subject"] = f"{otp_code} is your Quotes App Verification Code"
    message.set_content(
        f"Welcome to Quotes App!\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes. If you did not request this, please ignore."
    )

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
        )
    except Exception as e:
        # Fallback to local log printing for dev testing without real SMTP credentials
        print(f"[MAIL DEV FALLBACK] Failed to send email via SMTP ({e}). Generated OTP for {to_email}: {otp_code}")