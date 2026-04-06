"""
Роутер для аутентификации и авторизации
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from slowapi import Limiter
from slowapi.util import get_remote_address

import models, schemas
from auth import get_db, get_current_user, hash_password, verify_password, create_token
from config import settings
import crud

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=schemas.TokenResponse)
def register(data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    if db.query(models.User).filter(models.User.email == data.email.lower()).first():
        raise HTTPException(400, "Email уже зарегистрирован")
    if len(data.password) < 6:
        raise HTTPException(400, "Пароль минимум 6 символов")

    user = models.User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        name=data.name
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
        has_profile=False
    )


@router.post("/login", response_model=schemas.TokenResponse)
@limiter.limit("5/5minutes")
def login(request: Request, data: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Вход в систему"""
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")

    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=bool(profile and profile.goal)
    )


@router.post("/google", response_model=schemas.TokenResponse)
def google_auth(data: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """Аутентификация через Google OAuth"""
    try:
        if not settings.GOOGLE_CLIENT_ID:
            raise HTTPException(500, "Google OAuth не настроен")

        info = id_token.verify_oauth2_token(
            data.credential,
            g_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = info.get("email", "").lower()
        name = info.get("name", "")
        google_id = info.get("sub", "")

        if not email:
            raise HTTPException(400, "Email не получен от Google")

        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(
                email=email,
                password_hash=f"google:{google_id}",
                name=name
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif user.password_hash.startswith("google:") and name and user.name != name:
            user.name = name
            db.commit()

        profile = crud.get_profile(db, user.id)
        return schemas.TokenResponse(
            access_token=create_token(user.id),
            user_id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            has_profile=bool(profile and profile.goal)
        )

    except ValueError as e:
        raise HTTPException(401, f"Невалидный Google токен: {str(e)}")


@router.get("/me", response_model=schemas.TokenResponse)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Получить информацию о текущем пользователе"""
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(
        access_token="",
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        has_profile=bool(profile and profile.goal)
    )
