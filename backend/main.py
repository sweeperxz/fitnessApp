import os
from datetime import date, datetime
from typing import Optional

import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import models, schemas, crud
from database import SessionLocal, engine
from auth import get_db, get_current_user, get_admin_user, hash_password, verify_password, create_token

try:
    from pywebpush import webpush, WebPushException
except ImportError:
    webpush = None
    WebPushException = Exception

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nutrio API", version="2.1.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ── Health ────────────────────────────────────────────────
@app.get("/health")
def health(): return {"status": "ok"}

# ── Auth: email/password ──────────────────────────────────
@app.post("/auth/register", response_model=schemas.TokenResponse)
def register(data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email.lower()).first():
        raise HTTPException(400, "Email уже зарегистрирован")
    if len(data.password) < 6:
        raise HTTPException(400, "Пароль минимум 6 символов")
    user = models.User(email=data.email.lower(), password_hash=hash_password(data.password), name=data.name)
    db.add(user); db.commit(); db.refresh(user)
    return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, role=user.role, has_profile=False)

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, role=user.role, has_profile=bool(profile and profile.goal))

# ── Auth: Google OAuth ────────────────────────────────────
@app.post("/auth/google", response_model=schemas.TokenResponse)
def google_auth(data: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """Принимает id_token от Google Sign-In и возвращает наш JWT"""
    try:
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(500, "Google OAuth не настроен: задайте GOOGLE_CLIENT_ID")
        info = id_token.verify_oauth2_token(data.credential, g_requests.Request(), GOOGLE_CLIENT_ID)
        
        email = info.get("email", "").lower()
        name  = info.get("name", "")
        google_id = info.get("sub", "")
        
        if not email:
            raise HTTPException(400, "Email не получен от Google")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            # Создаём нового пользователя — пароль не нужен (google_id как hash)
            user = models.User(email=email, password_hash=f"google:{google_id}", name=name)
            db.add(user); db.commit(); db.refresh(user)
        elif user.password_hash.startswith("google:"):
            # Обновляем имя если изменилось
            if name and user.name != name:
                user.name = name; db.commit()
        
        profile = crud.get_profile(db, user.id)
        return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, role=user.role, has_profile=bool(profile and profile.goal))
    
    except ValueError as e:
        raise HTTPException(401, f"Невалидный Google токен: {str(e)}")

@app.get("/auth/me", response_model=schemas.TokenResponse)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(access_token="", user_id=user.id, name=user.name, email=user.email, role=user.role, has_profile=bool(profile and profile.goal))

# ── Admin ──────────────────────────────────────────────────
@app.get("/admin/users", response_model=list[schemas.UserAdminResponse])
def get_all_users(admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.id.desc()).all()

@app.put("/admin/users/{user_id}/role", response_model=schemas.UserAdminResponse)
def update_role(user_id: int, data: schemas.UserRoleUpdate, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    # Защита от снятия админки самому себе
    if user_id == admin.id and data.role != 'admin':
        raise HTTPException(400, "Нельзя снять роль администратора самому себе")
    user = crud.update_user_role(db, user_id, data.role)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    return user

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, admin: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(400, "Нельзя удалить самого себя")
    success = crud.delete_user(db, user_id)
    if not success:
        raise HTTPException(404, "Пользователь не найден")
    return {"ok": True}

# ── Profile ───────────────────────────────────────────────
@app.get("/profile", response_model=schemas.Profile)
def get_profile(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = crud.get_profile(db, user.id)
    if not p: raise HTTPException(404, "Profile not found")
    return p

@app.post("/profile", response_model=schemas.Profile)
def upsert_profile(data: schemas.ProfileCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.upsert_profile(db, user.id, data)

# ── Nutrition ─────────────────────────────────────────────
@app.get("/nutrition/{day}", response_model=schemas.NutritionDay)
def get_nutrition(day: date, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_nutrition_day(db, user.id, day)

@app.post("/nutrition/meal", response_model=schemas.Meal)
def add_meal(data: schemas.MealCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    nutrition_before = crud.get_nutrition_day(db, user.id, today)
    profile = crud.get_profile(db, user.id)
    
    meal = crud.add_meal(db, user.id, data)
    
    if profile and profile.calories_goal:
        nutrition_after = crud.get_nutrition_day(db, user.id, today)
        if nutrition_before.total_calories < profile.calories_goal and nutrition_after.total_calories >= profile.calories_goal:
            send_push_notification(db, user.id, "🎯 Отлично! Дневная цель по калориям достигнута!")
            
    return meal

@app.delete("/nutrition/meal/{meal_id}")
def delete_meal(meal_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    crud.delete_meal(db, meal_id, user.id); return {"ok": True}

@app.post("/nutrition/water", response_model=schemas.WaterLog)
def log_water(data: schemas.WaterLogCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    nutrition_before = crud.get_nutrition_day(db, user.id, today)
    profile = crud.get_profile(db, user.id)
    
    water = crud.log_water(db, user.id, data)
    
    if profile and profile.water_goal:
        nutrition_after = crud.get_nutrition_day(db, user.id, today)
        if nutrition_before.water_ml < profile.water_goal and nutrition_after.water_ml >= profile.water_goal:
            send_push_notification(db, user.id, "💧 Супер! Вы выпили дневную норму воды!")
            
    return water

# ── Workouts ──────────────────────────────────────────────
@app.get("/workouts", response_model=list[schemas.Workout])
def get_workouts(from_date: Optional[date] = None, to_date: Optional[date] = None, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_workouts(db, user.id, from_date, to_date)

@app.post("/workouts", response_model=schemas.Workout)
def create_workout(data: schemas.WorkoutCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_workout(db, user.id, data)

@app.post("/workouts/{workout_id}/exercises", response_model=schemas.Exercise)
def add_exercise(workout_id: int, data: schemas.ExerciseCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ex = crud.add_exercise(db, workout_id, user.id, data)
    if not ex: raise HTTPException(404, "Workout not found")
    return ex

@app.delete("/workouts/{workout_id}")
def delete_workout(workout_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    crud.delete_workout(db, workout_id, user.id); return {"ok": True}

# ── Stats ─────────────────────────────────────────────────
@app.get("/stats", response_model=schemas.Stats)
def get_stats(days: int = 30, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_stats(db, user.id, days)

# ── AI Assistant (Gemini) ─────────────────────────────────
@app.post("/ai/chat")
async def ai_chat(data: schemas.ChatRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY не настроен на сервере")

    # 1. Получаем профиль для системного промпта
    profile = crud.get_profile(db, user.id)
    sys_prompt = "Ты персональный фитнес-ассистент Nutrio. Отвечай на русском, кратко и конкретно. уместить в maxOutputTokens: 5500,"
    if profile:
        sys_prompt += f" Пользователь: вес {profile.weight}кг, цель: {profile.goal}, КБЖУ цель: {profile.calories_goal}ккал, белки {profile.protein_goal}г."

    # 2. Форматируем историю сообщений под стандарт Gemini
    gemini_messages = []
    for msg in data.messages:
        # Gemini использует роль 'model' вместо 'assistant'
        role = "model" if msg.role == "assistant" else "user"
        gemini_messages.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    # 3. Собираем тело запроса
    payload = {
        "systemInstruction": {
            "parts": [{"text": sys_prompt}]
        },
        "contents": gemini_messages,
        "generationConfig": {
            "maxOutputTokens": 5500,
            "temperature": 0.7 # Немного креативности, но без ухода от темы
        }
    }

    # Используем быструю модель gemini-1.5-flash (отлично подходит для чатов)
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    # 4. Отправляем запрос
    headers = {"x-goog-api-key": api_key, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload, headers=headers, timeout=30.0)
            res.raise_for_status()
            return res.json() # Возвращаем сырой ответ Gemini на фронтенд
        except httpx.HTTPStatusError as e:
            # Выводим ошибку в консоль сервера для дебага
            print(f"Gemini API Error: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="Ошибка от провайдера AI")
        except Exception as e:
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при обращении к AI")


@app.get("/foods/recent", response_model=list[schemas.FoodItemResponse])
def get_recent_foods(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Берем топ-20 последних продуктов юзера
    foods = db.query(models.UserFood).filter(models.UserFood.user_id == user.id) \
        .order_by(models.UserFood.last_used.desc()).limit(20).all()
    return foods


@app.post("/foods/recent")
def add_recent_food(data: schemas.FoodItemCreate, user: models.User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    # Ищем, есть ли уже такой продукт в истории юзера (по имени и калориям, чтобы не плодить дубли)
    existing = db.query(models.UserFood).filter(
        models.UserFood.user_id == user.id,
        models.UserFood.name == data.name
    ).first()

    if existing:
        # Если есть, просто обновляем время, чтобы он поднялся наверх списка
        existing.last_used = datetime.utcnow()
    else:
        # Если нет, создаем новую запись
        new_food = models.UserFood(
            user_id=user.id,
            name=data.name,
            brand=data.brand,
            calories=data.calories,
            protein=data.protein,
            fat=data.fat,
            carbs=data.carbs
        )
        db.add(new_food)

    db.commit()
    return {"ok": True}


# ── Push Notifications ────────────────────────────────────
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "mailto:test@example.com")

def send_push_notification(db: Session, user_id: int, message: str):
    if not webpush or not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        return
    subs = crud.get_push_subscriptions(db, user_id)
    for s in subs:
        try:
            webpush(
                subscription_info={"endpoint": s.endpoint, "keys": {"p256dh": s.p256dh, "auth": s.auth}},
                data=message,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_EMAIL if VAPID_EMAIL.startswith(("mailto:", "https://")) else f"mailto:{VAPID_EMAIL}"}
            )
        except Exception:
            pass


@app.get("/push/vapid-public-key")
def get_vapid_public_key():
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(500, "VAPID_PUBLIC_KEY не настроен")
    return {"public_key": VAPID_PUBLIC_KEY}


@app.post("/push/subscribe")
def subscribe(data: schemas.PushSubscriptionCreate, user: models.User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    crud.subscribe_push(db, user.id, data)
    return {"ok": True}


@app.post("/push/test")
def test_push(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not webpush:
        raise HTTPException(500, "библиотека pywebpush не установлена")
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        raise HTTPException(500, f"VAPID ключи не настроены. Добавьте VAPID_PRIVATE_KEY и VAPID_PUBLIC_KEY в .env")

    subs = crud.get_push_subscriptions(db, user.id)
    if not subs:
        raise HTTPException(404, "Подписки не найдены. Сначала включи уведомления в профиле.")

    results = []
    for s in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": s.endpoint,
                    "keys": {"p256dh": s.p256dh, "auth": s.auth}
                },
                data="Привет от Nutrio! Уведомления работают 🎉",
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_EMAIL if VAPID_EMAIL.startswith(("mailto:", "https://")) else f"mailto:{VAPID_EMAIL}"}
            )
            results.append({"endpoint": s.endpoint, "status": "sent"})
        except WebPushException as ex:
            results.append({"endpoint": s.endpoint, "status": "failed", "error": str(ex)})

    return {"ok": True, "results": results}