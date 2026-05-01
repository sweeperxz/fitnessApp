"""
Поиск и история продуктов: интеграция с FatSecret + локальная история.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db
from rate_limit import limiter
from services import fatsecret_service

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("/search", response_model=list[schemas.FoodItemBase])
@limiter.limit("30/minute")
async def search_foods(
    request: Request,
    q: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 8,
):
    query = q.strip()
    if len(query) < 2:
        return []

    profile = crud.get_profile(db, user.id)
    region = getattr(profile, "fatsecret_region", None) if profile else None
    return await fatsecret_service.search_foods(query, limit, region=region)


@router.get("/barcode/{barcode}", response_model=schemas.FoodItemBase)
@limiter.limit("30/minute")
async def find_food_by_barcode(
    request: Request,
    barcode: str,
    user: models.User = Depends(get_current_user),
):
    clean_barcode = "".join(ch for ch in barcode if ch.isdigit())
    if not clean_barcode:
        raise HTTPException(400, "Invalid barcode")

    food = await fatsecret_service.get_food_by_barcode(clean_barcode)
    if not food:
        raise HTTPException(404, "Food not found")
    return food


@router.get("/recent", response_model=list[schemas.FoodItemResponse])
def get_recent_foods(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    limit = min(limit, 50)
    return (
        db.query(models.UserFood)
        .filter(models.UserFood.user_id == user.id)
        .order_by(models.UserFood.last_used.desc())
        .limit(limit)
        .all()
    )


@router.post("/recent")
def add_recent_food(
    data: schemas.FoodItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.UserFood)
        .filter(models.UserFood.user_id == user.id, models.UserFood.name == data.name)
        .first()
    )

    if existing:
        existing.last_used = datetime.utcnow()
    else:
        db.add(
            models.UserFood(
                user_id=user.id,
                name=data.name,
                brand=data.brand,
                calories=data.calories,
                protein=data.protein,
                fat=data.fat,
                carbs=data.carbs,
            )
        )

    db.commit()
    return {"ok": True}
