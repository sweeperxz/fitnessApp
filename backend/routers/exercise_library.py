"""
Роутер каталога упражнений.
"""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db

router = APIRouter(prefix="/exercise-library", tags=["exercise-library"])


@router.get("", response_model=list[schemas.ExerciseLibraryItem])
def get_exercise_library(
    q: Optional[str] = None,
    muscle: Optional[str] = None,
    equipment: Optional[str] = None,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_exercise_library(db, muscle=muscle, q=q, equipment=equipment)
