from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    generate_secure_otp,
)
from app.models.user import User
from app.models.otp import OtpCode
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    VerifyOtpRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    GoogleAuthRequest,
    GitHubAuthRequest,
    TokenResponse,
    AuthActionResponse,
    UserOut,
)
from app.services.email import (
    send_verification_otp_email,
    send_login_otp_email,
    send_password_reset_email,
    send_account_locked_alert,
)
from app.services.oauth import exchange_google_code_or_token, verify_google_id_token, get_github_user_profile
from app.api.deps import get_current_user

router = APIRouter()


# ============================================================================
# 1. REGISTRO & VERIFICACIÓN OTP POR CORREO
# ============================================================================
@router.post(
    "/register",
    response_model=AuthActionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo usuario y enviar código OTP a su correo",
)
async def register(
    user_in: UserRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una cuenta activa con este correo electrónico.",
            )
        else:
            # User registered before but not verified yet: update info
            existing_user.full_name = user_in.full_name
            existing_user.hashed_password = get_password_hash(user_in.password)
            user = existing_user
    else:
        # Create new user
        user = User(
            email=user_in.email.lower(),
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            is_active=True,
            is_verified=False,
            auth_provider="email",
        )
        db.add(user)

    # Invalidate previous registration OTP codes for this email
    db.query(OtpCode).filter(
        OtpCode.email == user_in.email.lower(),
        OtpCode.code_type == "register_verification",
        OtpCode.is_used == False,
    ).update({"is_used": True})

    # Generate new 6-digit OTP code
    otp_code_str = generate_secure_otp(6)
    otp_entry = OtpCode(
        email=user_in.email.lower(),
        code=otp_code_str,
        code_type="register_verification",
        expires_at=OtpCode.generate_expiry(settings.OTP_EXPIRE_MINUTES),
        is_used=False,
    )
    db.add(otp_entry)
    db.commit()

    # Send verification email via Google SMTP in background
    background_tasks.add_task(
        send_verification_otp_email,
        to_email=user.email,
        code=otp_code_str,
        user_name=user.full_name,
    )

    return AuthActionResponse(
        status="success",
        message=f"Código de verificación de 6 dígitos enviado exitosamente a {user.email}",
        require_otp=True,
    )


@router.post(
    "/verify-email-otp",
    response_model=TokenResponse,
    summary="Verificar código OTP y activar cuenta",
)
def verify_email_otp(
    payload: VerifyOtpRequest,
    db: Session = Depends(get_db),
) -> Any:
    # Look for valid OTP
    otp_entry = (
        db.query(OtpCode)
        .filter(
            OtpCode.email == payload.email.lower(),
            OtpCode.code == payload.code,
            OtpCode.code_type == payload.code_type,
            OtpCode.is_used == False,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp_entry or otp_entry.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación es inválido o ha expirado.",
        )

    # Mark OTP as used
    otp_entry.is_used = True

    # Activate & verify user
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    user.is_verified = True
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)

    # Generate JWT access token
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post(
    "/resend-otp",
    response_model=AuthActionResponse,
    summary="Reenviar código OTP de 6 dígitos por correo",
)
async def resend_otp(
    payload: ResendOtpRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    # Invalidate previous OTPs
    db.query(OtpCode).filter(
        OtpCode.email == payload.email.lower(),
        OtpCode.code_type == payload.code_type,
        OtpCode.is_used == False,
    ).update({"is_used": True})

    # Generate new OTP
    otp_code_str = generate_secure_otp(6)
    otp_entry = OtpCode(
        email=payload.email.lower(),
        code=otp_code_str,
        code_type=payload.code_type,
        expires_at=OtpCode.generate_expiry(settings.OTP_EXPIRE_MINUTES),
        is_used=False,
    )
    db.add(otp_entry)
    db.commit()

    # Trigger email dispatch
    if payload.code_type == "password_reset":
        background_tasks.add_task(
            send_password_reset_email,
            to_email=user.email,
            code=otp_code_str,
            user_name=user.full_name,
        )
    else:
        background_tasks.add_task(
            send_verification_otp_email,
            to_email=user.email,
            code=otp_code_str,
            user_name=user.full_name,
        )

    return AuthActionResponse(
        status="success",
        message=f"Nuevo código de verificación enviado a {user.email}",
        require_otp=True,
    )


# ============================================================================
# 2. INICIO DE SESIÓN CON BLOQUEO POR INTENTOS
# ============================================================================
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión con protección contra fuerza bruta",
)
async def login(
    credentials: UserLogin,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas.",
        )

    # 1. Check if account is temporarily locked
    if user.is_locked:
        remaining_seconds = max(1, int((user.locked_until - datetime.utcnow()).total_seconds()))
        if remaining_seconds >= 3600:
            hours = remaining_seconds // 3600
            mins = (remaining_seconds % 3600) // 60
            time_str = f"{hours}h {mins}m" if mins > 0 else f"{hours} hora(s)"
        elif remaining_seconds >= 60:
            time_str = f"{remaining_seconds // 60} minuto(s)"
        else:
            time_str = f"{remaining_seconds} segundo(s)"

        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Cuenta bloqueada temporalmente por seguridad. Podrás reintentar en {time_str}.",
            headers={"Retry-After": str(remaining_seconds)},
        )

    # 2. Verify Password
    if not verify_password(credentials.password, user.hashed_password):
        user.failed_login_attempts += 1
        attempts = user.failed_login_attempts

        # Escalonamiento de seguridad:
        # Nivel 1: 5 intentos fallidos -> Bloqueo por 1 minuto
        # Nivel 2: +2 intentos (total 7) -> Bloqueo por 1 hora
        # Nivel 3: +1 intento (total 8+) -> Bloqueo por 24 horas
        should_lock = False
        lock_duration = timedelta(minutes=1)
        lock_label = "1 minuto"
        remaining_in_tier = 0

        if attempts < 5:
            remaining_in_tier = 5 - attempts
        elif attempts == 5:
            should_lock = True
            lock_duration = timedelta(minutes=1)
            lock_label = "1 minuto"
        elif attempts < 7:
            remaining_in_tier = 7 - attempts
        elif attempts == 7:
            should_lock = True
            lock_duration = timedelta(hours=1)
            lock_label = "1 hora"
        elif attempts < 8:
            remaining_in_tier = 8 - attempts
        else:
            should_lock = True
            lock_duration = timedelta(hours=24)
            lock_label = "24 horas"

        if should_lock:
            user.locked_until = datetime.utcnow() + lock_duration
            db.commit()

            # Dispatch security alert email
            background_tasks.add_task(
                send_account_locked_alert,
                to_email=user.email,
                user_name=user.full_name,
                minutes=int(lock_duration.total_seconds() // 60),
            )

            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Límite de intentos alcanzado. Por seguridad tu cuenta ha sido bloqueada durante {lock_label}.",
                headers={"Retry-After": str(int(lock_duration.total_seconds()))},
            )

        db.commit()

        if remaining_in_tier <= 2:
            detail_msg = f"Correo o contraseña incorrectos. Te quedan solo {remaining_in_tier} intento(s) antes del bloqueo por seguridad."
        else:
            detail_msg = "Correo o contraseña incorrectos."

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_msg,
        )

    # 3. Successful password match -> Reset security counters
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    db.refresh(user)

    # 4. Generate access token
    access_token = create_access_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


# ============================================================================
# 3. RECUPERACIÓN DE CONTRASEÑA
# ============================================================================
@router.post(
    "/forgot-password",
    response_model=AuthActionResponse,
    summary="Solicitar código de restablecimiento de contraseña",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Any:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        # Por seguridad no revelamos si el correo existe o no
        return AuthActionResponse(
            status="success",
            message=f"Si el correo {payload.email} está registrado, recibirás un código de recuperación.",
            require_otp=True,
        )

    # Invalidate previous reset OTPs
    db.query(OtpCode).filter(
        OtpCode.email == payload.email.lower(),
        OtpCode.code_type == "password_reset",
        OtpCode.is_used == False,
    ).update({"is_used": True})

    # Generate OTP
    otp_code_str = generate_secure_otp(6)
    otp_entry = OtpCode(
        email=payload.email.lower(),
        code=otp_code_str,
        code_type="password_reset",
        expires_at=OtpCode.generate_expiry(settings.OTP_EXPIRE_MINUTES),
        is_used=False,
    )
    db.add(otp_entry)
    db.commit()

    # Send reset email
    background_tasks.add_task(
        send_password_reset_email,
        to_email=user.email,
        code=otp_code_str,
        user_name=user.full_name,
    )

    return AuthActionResponse(
        status="success",
        message=f"Código de recuperación de contraseña enviado a {payload.email}",
        require_otp=True,
    )


@router.post(
    "/verify-reset-otp",
    response_model=AuthActionResponse,
    summary="Validar código OTP de restablecimiento de contraseña",
)
def verify_reset_otp(
    payload: VerifyOtpRequest,
    db: Session = Depends(get_db),
) -> Any:
    otp_entry = (
        db.query(OtpCode)
        .filter(
            OtpCode.email == payload.email.lower(),
            OtpCode.code == payload.code,
            OtpCode.code_type == "password_reset",
            OtpCode.is_used == False,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp_entry or otp_entry.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de 6 dígitos es inválido o ha expirado.",
        )

    return AuthActionResponse(
        status="success",
        message="Código de recuperación válido.",
    )


@router.post(
    "/reset-password",
    response_model=AuthActionResponse,
    summary="Restablecer contraseña con código de verificación",
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> Any:
    otp_entry = (
        db.query(OtpCode)
        .filter(
            OtpCode.email == payload.email.lower(),
            OtpCode.code == payload.code,
            OtpCode.code_type == "password_reset",
            OtpCode.is_used == False,
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp_entry or otp_entry.is_expired:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de recuperación es inválido o ha expirado.",
        )

    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )

    # Update password and unlock account
    user.hashed_password = get_password_hash(payload.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    otp_entry.is_used = True
    db.commit()

    return AuthActionResponse(
        status="success",
        message="Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.",
    )


# ============================================================================
# 4. OAUTH: INICIO DE SESIÓN CON GOOGLE Y GITHUB
# ============================================================================
@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Autenticación con Google OAuth (Google ID Token o Auth Code)",
)
async def google_auth(
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db),
) -> Any:
    profile = await exchange_google_code_or_token(payload.id_token)
    if not profile or not profile.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo validar la autenticación con Google. Verifica las credenciales.",
        )

    email = profile["email"].lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create user via Google
        user = User(
            email=email,
            full_name=profile.get("full_name", "Usuario Google"),
            avatar_url=profile.get("avatar_url"),
            auth_provider="google",
            provider_id=profile.get("provider_id"),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
    else:
        # Update user profile details
        user.is_verified = True
        if not user.avatar_url and profile.get("avatar_url"):
            user.avatar_url = profile.get("avatar_url")

    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post(
    "/github",
    response_model=TokenResponse,
    summary="Autenticación con GitHub OAuth",
)
async def github_auth(
    payload: GitHubAuthRequest,
    db: Session = Depends(get_db),
) -> Any:
    profile = await get_github_user_profile(payload.code_or_token)
    if not profile or not profile.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo autenticar con GitHub.",
        )

    email = profile["email"].lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            full_name=profile.get("full_name", "Usuario GitHub"),
            avatar_url=profile.get("avatar_url"),
            auth_provider="github",
            provider_id=profile.get("provider_id"),
            is_active=True,
            is_verified=True,
        )
        db.add(user)
    else:
        user.is_verified = True
        if not user.avatar_url and profile.get("avatar_url"):
            user.avatar_url = profile.get("avatar_url")

    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


# ============================================================================
# 5. PERFIL DE USUARIO ACTUAL
# ============================================================================
@router.get(
    "/me",
    response_model=UserOut,
    summary="Obtener perfil del usuario autenticado",
)
def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user
