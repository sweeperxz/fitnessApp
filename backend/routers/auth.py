"""
Роутер аутентификации: email/password + Google OAuth + /auth/me.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from google.auth.transport import requests as g_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import (
    create_token,
    get_current_user,
    get_db,
    hash_password,
    validate_password_strength,
    verify_password,
)
from config import settings
from rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse)
@limiter.limit("5/15minutes")
def register(
    request: Request,
    data: schemas.RegisterRequest,
    db: Session = Depends(get_db),
):
    if db.query(models.User).filter(models.User.email == data.email.lower()).first():
        raise HTTPException(400, "Email уже зарегистрирован")

    is_valid, error_msg = validate_password_strength(data.password)
    if not is_valid:
        raise HTTPException(400, error_msg)

    user = models.User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        name=data.name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=False,
    )


@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/5minutes")
def login(
    request: Request,
    data: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")

    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=bool(profile and profile.goal),
    )


@router.post("/google", response_model=schemas.TokenResponse)
def google_auth(data: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """Принимает id_token от Google Sign-In и возвращает наш JWT."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(500, "Google OAuth не настроен: задайте GOOGLE_CLIENT_ID")

    try:
        info = id_token.verify_oauth2_token(
            data.credential, g_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(401, f"Невалидный Google токен: {e}")

    email = info.get("email", "").lower()
    name = info.get("name", "")
    google_id = info.get("sub", "")

    if not email or not google_id:
        raise HTTPException(400, "Email або Google ID не отримано від Google")

    # Сначала ищем по google_id (самый безопасный путь)
    user = db.query(models.User).filter(models.User.google_id == google_id).first()

    if not user:
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user and existing_user.password_hash:
            # Email уже зарегистрирован через пароль — не привязываем Google автоматически
            raise HTTPException(
                400, "Користувач з таким email вже зареєстрований через пароль"
            )

        user = models.User(
            email=email,
            google_id=google_id,
            name=name,
            password_hash=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if name and user.name != name:
            user.name = name
            db.commit()

    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=bool(profile and profile.goal),
    )


@router.get("/me", response_model=schemas.TokenResponse)
def me(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(
        access_token="",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=bool(profile and profile.goal),
    )
