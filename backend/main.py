import datetime
import os, httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import models, schemas, crud
from database import SessionLocal, engine
from auth import get_db, get_current_user, hash_password, verify_password, create_token

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="FitFlowAI API", version="2.1.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins] + ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

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
    return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, has_profile=False)

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Неверный email или пароль")
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, has_profile=bool(profile and profile.goal))

# ── Auth: Google OAuth ────────────────────────────────────
@app.post("/auth/google", response_model=schemas.TokenResponse)
def google_auth(data: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    """Принимает id_token от Google Sign-In и возвращает наш JWT"""
    try:
        if GOOGLE_CLIENT_ID:
            info = id_token.verify_oauth2_token(data.credential, g_requests.Request(), GOOGLE_CLIENT_ID)
        else:
            # Dev mode: decode without verification (только для разработки!)
            import json, base64
            payload = data.credential.split('.')[1]
            payload += '=' * (4 - len(payload) % 4)
            info = json.loads(base64.urlsafe_b64decode(payload))
        
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
        return schemas.TokenResponse(access_token=create_token(user.id), user_id=user.id, name=user.name, email=user.email, has_profile=bool(profile and profile.goal))
    
    except ValueError as e:
        raise HTTPException(401, f"Невалидный Google токен: {str(e)}")

@app.get("/auth/me", response_model=schemas.TokenResponse)
def me(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = crud.get_profile(db, user.id)
    return schemas.TokenResponse(access_token="", user_id=user.id, name=user.name, email=user.email, has_profile=bool(profile and profile.goal))

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
    return crud.add_meal(db, user.id, data)

@app.delete("/nutrition/meal/{meal_id}")
def delete_meal(meal_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    crud.delete_meal(db, meal_id, user.id); return {"ok": True}

@app.post("/nutrition/water", response_model=schemas.WaterLog)
def log_water(data: schemas.WaterLogCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.log_water(db, user.id, data)

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
    sys_prompt = "Ты персональный фитнес-ассистент FitFlowAI. Отвечай на русском, кратко и конкретно. уместить в maxOutputTokens: 5500,"
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
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    # 4. Отправляем запрос
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(url, json=payload, timeout=30.0)
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