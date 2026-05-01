"""
Агрегированная статистика по пользователю.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=schemas.Stats)
def get_stats(
    days: int = 30,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_stats(db, user.id, days)
