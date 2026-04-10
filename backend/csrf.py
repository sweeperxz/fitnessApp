from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from fastapi import HTTPException, Header
from config import settings

# CSRF token serializer
csrf_serializer = URLSafeTimedSerializer(settings.SECRET_KEY, salt="csrf-token")

def generate_csrf_token(user_id: int) -> str:
    """Генерує CSRF токен для користувача"""
    return csrf_serializer.dumps(user_id)

def verify_csrf_token(token: str, user_id: int, max_age: int = 3600) -> bool:
    """Перевіряє CSRF токен. max_age в секундах (за замовчуванням 1 година)"""
    try:
        token_user_id = csrf_serializer.loads(token, max_age=max_age)
        return token_user_id == user_id
    except (BadSignature, SignatureExpired):
        return False

def require_csrf(
    x_csrf_token: str = Header(None, alias="X-CSRF-Token")
):
    """Dependency для перевірки CSRF токена"""
    if not x_csrf_token:
        raise HTTPException(403, "CSRF token відсутній")
    return x_csrf_token
