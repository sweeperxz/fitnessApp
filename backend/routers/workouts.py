"""
Роутер тренировок и упражнений.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.get("", response_model=list[schemas.Workout])
def get_workouts(
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_workouts(db, user.id, from_date, to_date)


@router.post("", response_model=schemas.Workout)
def create_workout(
    data: schemas.WorkoutCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_workout(db, user.id, data)


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
    crud.delete_workout(db, workout_id, user.id)
    return {"ok": True}
