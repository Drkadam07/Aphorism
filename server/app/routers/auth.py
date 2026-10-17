import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, EmailOTP, AuditLog
from app.schemas import UserRegister, VerifyOTP, ResendOTP, UserLogin, Token
from app.security import get_password_hash, verify_password, create_access_token
from app.email_service import generate_otp, send_otp_email
from app.config import settings
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegister, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    if (
        db.query(User)
        .filter((User.email == user_in.email) | (User.username == user_in.username))
        .first()
    ):
        raise HTTPException(
            status_code=400, detail="Username or Email already registered"
        )

    new_user = User(
        name=user_in.name,
        username=user_in.username.lower(),
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        is_verified=False,
    )
    db.add(new_user)
    db.commit()

    otp_code = generate_otp()
    otp_entry = EmailOTP(
        email=new_user.email,
        otp_code=otp_code,
        expires_at=datetime.datetime.utcnow()
        + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp_entry)
    db.commit()

    bg_tasks.add_task(send_otp_email, new_user.email, otp_code)
    return {"message": "Account created. Verification OTP sent to your email."}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == data.email.lower(),
            EmailOTP.otp_code == data.otp_code,
            EmailOTP.is_used == False,
            EmailOTP.expires_at > datetime.datetime.utcnow(),
        )
        .order_by(EmailOTP.id.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")

    otp_record.is_used = True
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if user:
        user.is_verified = True
    db.commit()

    access_token = create_access_token(subject=user.id)
    return {
        "message": "Email verified successfully",
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/resend-otp")
def resend_otp(
    data: ResendOTP, bg_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")

    otp_code = generate_otp()
    otp_entry = EmailOTP(
        email=user.email,
        otp_code=otp_code,
        expires_at=datetime.datetime.utcnow()
        + datetime.timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp_entry)
    db.commit()

    bg_tasks.add_task(send_otp_email, user.email, otp_code)
    return {"message": "New OTP dispatched"}


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    ident = login_data.username_or_email.lower()
    user = (
        db.query(User).filter((User.email == ident) | (User.username == ident)).first()
    )
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(
            status_code=403, detail="Please verify your email before logging in"
        )

    # Log action
    log = AuditLog(
        user_id=user.id,
        action="LOGIN_SUCCESS",
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    db.commit()

    return {
        "access_token": create_access_token(subject=user.id),
        "token_type": "bearer",
    }


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # With stateless JWTs, frontend drops token; return status 200
    return {"message": "Successfully logged out"}
