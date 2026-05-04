"""
Роутер тренировок и упражнений.
"""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db

router = APIRouter(prefix="/workouts", tags=["workouts"])

# Максимальный диапазон выборки тренировок. Без этого лимита админ-юзер
# мог бы случайным `from_date=2000-01-01` достать всю историю
# (с прежним joinedload(exercises) — это очень тяжёлый запрос).
_MAX_DATE_RANGE_DAYS = 366


@router.get("", response_model=list[schemas.Workout])
def get_workouts(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if from_date and to_date:
        if from_date > to_date:
            # Раньше при перевёрнутом диапазоне возвращался пустой список —
            # фронт не мог отличить «нет тренировок» от «ошибка ввода».
            raise HTTPException(400, "from_date must be <= to_date")
        if (to_date - from_date) > timedelta(days=_MAX_DATE_RANGE_DAYS):
            raise HTTPException(
                400,
                f"Date range too large (max {_MAX_DATE_RANGE_DAYS} days)",
            )
    return crud.get_workouts(db, user.id, from_date, to_date)


@router.post("", response_model=schemas.Workout)
def create_workout(
    data: schemas.WorkoutCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return crud.create_workout(db, user.id, data)
    except ValueError:
        # op_id уже использован для совсем другой операции
        # (например, тот же UUID был выдан для add_meal). Не дедупим
        # межресурсно — отвечаем 409, чтобы фронт не молча проглотил.
        raise HTTPException(
            409,
            detail={
                "code": "OP_ID_CONFLICT",
                "message": "op_id already used for different operation",
            },
        )


@router.post("/{workout_id}/exercises", response_model=schemas.Exercise)
def add_exercise(
    workout_id: int,
    data: schemas.ExerciseCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ex = crud.add_exercise(db, workout_id, user.id, data)
    if not ex:
        raise HTTPException(404, "Workout not found")
    return ex


@router.delete("/{workout_id}")
def delete_workout(
    workout_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not crud.delete_workout(db, workout_id, user.id):
        raise HTTPException(404, "Workout not found")
    return {"ok": True}
