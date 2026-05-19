"""
Поиск и история продуктов: интеграция с FatSecret + локальная база и кэширование.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db
from models import utcnow
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

    # 1. Сначала ищем в нашей локальной БД (по штрих-коду или названию)
    local_results = []
    if query.isdigit():
        local_results = db.query(models.UserFood).filter(models.UserFood.barcode == query).all()
    
    if not local_results:
        local_results = (
            db.query(models.UserFood)
            .filter(models.UserFood.name.ilike(f"%{query}%"))
            .limit(limit)
            .all()
        )

    # Преобразуем локальные результаты в список словарей, исключая дубликаты
    merged = []
    seen_keys = set()
    
    for item in local_results:
        res_item = {
            "name": item.name,
            "brand": item.brand or "",
            "calories": item.calories,
            "protein": item.protein,
            "fat": item.fat,
            "carbs": item.carbs,
            "barcode": item.barcode,
        }
        # Уникальный ключ для дедупликации
        key = f"{item.name.lower()}||{(item.brand or '').lower()}"
        if key not in seen_keys:
            merged.append(res_item)
            seen_keys.add(key)

    # 2. Ищем во внешнем сервисе FatSecret
    profile = crud.get_profile(db, user.id)
    region = getattr(profile, "fatsecret_region", None) if profile else None

    try:
        api_results = await fatsecret_service.search_foods(query, limit, region=region)
        for item in api_results:
            key = f"{item['name'].lower()}||{item.get('brand', '').lower()}"
            if key not in seen_keys:
                merged.append(item)
                seen_keys.add(key)
    except Exception:
        # Если API упал или недоступен, продолжаем работу с локальными результатами
        pass

    return merged[:limit]


@router.get("/barcode/{barcode}", response_model=schemas.FoodItemBase)
@limiter.limit("30/minute")
async def find_food_by_barcode(
    request: Request,
    barcode: str,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clean_barcode = "".join(ch for ch in barcode if ch.isdigit())
    if not clean_barcode:
        raise HTTPException(400, "Invalid barcode")

    # 1. Ищем в нашей локальной БД продуктов
    local_food = db.query(models.UserFood).filter(models.UserFood.barcode == clean_barcode).first()
    if local_food:
        return {
            "name": local_food.name,
            "brand": local_food.brand or "",
            "calories": local_food.calories,
            "protein": local_food.protein,
            "fat": local_food.fat,
            "carbs": local_food.carbs,
            "barcode": local_food.barcode,
        }

    # 2. Если локально нет, ищем в FatSecret
    profile = crud.get_profile(db, user.id)
    region = getattr(profile, "fatsecret_region", None) if profile else None

    food = await fatsecret_service.get_food_by_barcode(clean_barcode, region=region)
    if not food:
        raise HTTPException(404, "Food not found")

    # Автоматически кэшируем найденный продукт в нашу локальную БД для будущих сканирований
    try:
        cached_food = models.UserFood(
            user_id=None,  # Глобальный продукт (доступный всем)
            name=food["name"],
            brand=food.get("brand"),
            barcode=clean_barcode,
            calories=int(food["calories"]),
            protein=int(food["protein"]),
            fat=int(food["fat"]),
            carbs=int(food["carbs"])
        )
        db.add(cached_food)
        db.commit()
    except Exception:
        db.rollback()

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


@router.post("/recent", response_model=schemas.FoodItemResponse)
def add_recent_food(
    data: schemas.FoodItemCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Пытаемся найти по штрих-коду (если передан) или по имени для данного юзера
    existing = None
    if data.barcode:
        existing = (
            db.query(models.UserFood)
            .filter(models.UserFood.barcode == data.barcode)
            .first()
        )

    if not existing:
        existing = (
            db.query(models.UserFood)
            .filter(models.UserFood.user_id == user.id, models.UserFood.name == data.name)
            .first()
        )

    if existing:
        existing.last_used = utcnow()
        existing.name = data.name
        existing.brand = data.brand
        existing.calories = data.calories
        existing.protein = data.protein
        existing.fat = data.fat
        existing.carbs = data.carbs
        if data.barcode:
            existing.barcode = data.barcode
        # Если это был глобальный продукт, привязываем его к юзеру в историю,
        # либо оставляем как есть, но для отображения в "недавних" юзера
        # присваиваем user_id.
        if existing.user_id is None:
            existing.user_id = user.id
        record = existing
    else:
        record = models.UserFood(
            user_id=user.id,
            name=data.name,
            brand=data.brand,
            barcode=data.barcode,
            calories=data.calories,
            protein=data.protein,
            fat=data.fat,
            carbs=data.carbs,
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record
