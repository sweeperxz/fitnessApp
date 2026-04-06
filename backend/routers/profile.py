"""
Роутер для работы с профилями пользователей
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models, schemas
from auth import get_current_user, get_db
from services.profile_service import get_user_profile, create_or_update_profile
from services.nutrition_calculator import calculate_nutrition_goals
from schemas_nutrition import CalculateGoalsRequest, CalculateGoalsResponse

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=schemas.Profile)
def get_profile(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить профиль текущего пользователя"""
    profile = get_user_profile(db, user.id)
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile


@router.post("", response_model=schemas.Profile)
def upsert_profile(
    data: schemas.ProfileCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать или обновить профиль"""
    return create_or_update_profile(db, user.id, data)


@router.post("/calculate-goals", response_model=CalculateGoalsResponse)
def calculate_goals(
    data: CalculateGoalsRequest,
    user: models.User = Depends(get_current_user)
):
    """
    Расчет целей по КБЖУ на основе параметров пользователя

    Вся бизнес-логика расчетов находится на backend.
    Frontend только отправляет параметры и получает результат.
    """
    result = calculate_nutrition_goals(
        weight=data.weight,
        height=data.height,
        age=data.age,
        gender=data.gender,
        goal=data.goal,
        activity=data.activity
    )

    return CalculateGoalsResponse(**result)

