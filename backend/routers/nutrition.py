"""
Роутер питания: дневная сводка, приёмы пищи, лог воды.

Push-уведомления при достижении цели запускаются через BackgroundTasks,
чтобы не блокировать HTTP-ответ webpush()-запросом.
"""
from datetime import date, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db
from services.push_service import send_push_notification

# Безопасные лимиты воды (общие константы домена).
MAX_SINGLE_WATER_INTAKE_ML = 2000
MAX_DAILY_WATER_ML = 10000

# Окно доступной истории. timedelta — а не today.replace(year=year-1) —
# чтобы не падать 29 февраля високосного года: в прошлом году такого числа нет.
NUTRITION_HISTORY_WINDOW = timedelta(days=365)

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.get("/{day}", response_model=schemas.NutritionDay)
def get_nutrition(
    day: date,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    earliest_allowed = today - NUTRITION_HISTORY_WINDOW

    if day > today:
        raise HTTPException(400, "Неможливо отримати дані для майбутньої дати")
    if day < earliest_allowed:
        raise HTTPException(400, "Дані доступні тільки за останній рік")

    return crud.get_nutrition_day(db, user.id, day)


@router.post("/meal", response_model=schemas.Meal)
def add_meal(
    data: schemas.MealCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.op_id:
        try:
            existing = crud.get_idempotent_meal(db, user.id, data.op_id)
        except ValueError:
            raise HTTPException(
                409,
                detail={
                    "code": "OP_ID_CONFLICT",
                    "message": "op_id already used for different operation",
                },
            )
        if existing:
            return existing

    was_reached_before, _, _ = crud.check_goal_reached(db, user.id, data.day, "calories")

    try:
        meal = crud.add_meal(db, user.id, data)
    except ValueError:
        raise HTTPException(
            409,
            detail={
                "code": "OP_ID_CONFLICT",
                "message": "op_id already used for different operation",
            },
        )

    was_reached_after, _, _ = crud.check_goal_reached(db, user.id, data.day, "calories")

    if not was_reached_before and was_reached_after:
        background_tasks.add_task(
            send_push_notification,
            user.id,
            "🎯 Отлично! Дневная цель по калориям достигнута!",
        )

    return meal


@router.delete("/meal/{meal_id}")
def delete_meal(
    meal_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not crud.delete_meal(db, meal_id, user.id):
        raise HTTPException(404, "Meal not found")
    return {"ok": True}


@router.post("/water", response_model=schemas.WaterLog)
def log_water(
    data: schemas.WaterLogCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.amount_ml > MAX_SINGLE_WATER_INTAKE_ML:
        raise HTTPException(
            400,
            detail={
                "code": "WATER_SINGLE_LIMIT_EXCEEDED",
                "message": "Разовий об'єм води перевищує безпечний ліміт",
                "limit_ml": MAX_SINGLE_WATER_INTAKE_ML,
                "amount_ml": data.amount_ml,
            },
        )

    current_daily_water = crud.get_daily_water(db, user.id, data.day)
    projected_daily_water = current_daily_water + data.amount_ml
    if projected_daily_water > MAX_DAILY_WATER_ML:
        raise HTTPException(
            400,
            detail={
                "code": "WATER_DAILY_LIMIT_EXCEEDED",
                "message": "Добовий об'єм води перевищує безпечний ліміт",
                "limit_ml": MAX_DAILY_WATER_ML,
                "current_ml": current_daily_water,
                "amount_ml": data.amount_ml,
                "projected_ml": projected_daily_water,
            },
        )

    if data.op_id:
        try:
            existing = crud.get_idempotent_water_log(db, user.id, data.op_id)
        except ValueError:
            raise HTTPException(
                409,
                detail={
                    "code": "OP_ID_CONFLICT",
                    "message": "op_id already used for different operation",
                },
            )
        if existing:
            return existing

    was_reached_before, _, _ = crud.check_goal_reached(db, user.id, data.day, "water")

    try:
        water = crud.log_water(db, user.id, data)
    except ValueError:
        raise HTTPException(
            409,
            detail={
                "code": "OP_ID_CONFLICT",
                "message": "op_id already used for different operation",
            },
        )

    was_reached_after, _, _ = crud.check_goal_reached(db, user.id, data.day, "water")

    if not was_reached_before and was_reached_after:
        background_tasks.add_task(
            send_push_notification,
            user.id,
            "💧 Супер! Вы выпили дневную норму воды!",
        )

    return water
