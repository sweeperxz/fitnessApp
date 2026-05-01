"""
AI-ассистент: проксирует запрос в Gemini с системным промптом по профилю.
"""
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db
from config import settings
from rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
)


@router.post("/chat")
@limiter.limit("10/minute")
async def ai_chat(
    request: Request,
    data: schemas.ChatRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(500, "GEMINI_API_KEY не настроен на сервере")

    profile = crud.get_profile(db, user.id)
    sys_prompt = (
        "Ты персональный фитнес-ассистент Nutrio. "
        "Отвечай на русском, кратко и конкретно. уместить в maxOutputTokens: 5500,"
    )
    if profile:
        sys_prompt += (
            f" Пользователь: вес {profile.weight}кг, цель: {profile.goal}, "
            f"КБЖУ цель: {profile.calories_goal}ккал, белки {profile.protein_goal}г."
        )

    gemini_messages = []
    for msg in data.messages:
        role = "model" if msg.role == "assistant" else "user"
        gemini_messages.append({"role": role, "parts": [{"text": msg.content}]})

    payload = {
        "systemInstruction": {"parts": [{"text": sys_prompt}]},
        "contents": gemini_messages,
        "generationConfig": {"maxOutputTokens": 5500, "temperature": 0.7},
    }

    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(GEMINI_URL, json=payload, headers=headers, timeout=30.0)
            res.raise_for_status()
            return res.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini API Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="Ошибка от провайдера AI")
        except Exception as e:
            logger.error(f"Internal AI chat error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера при обращении к AI")
