"""
Сервисный слой для работы с питанием (meals, water)
"""
from sqlalchemy.orm import Session
from datetime import date
import models, schemas


def get_daily_calories(db: Session, user_id: int, day: date) -> float:
    """Получить сумму калорий за день"""
    meals = db.query(models.Meal).filter(
        models.Meal.user_id == user_id,
        models.Meal.day == day
    ).all()
    return sum(m.calories for m in meals)


def get_daily_water(db: Session, user_id: int, day: date) -> int:
    """Получить сумму воды за день"""
    logs = db.query(models.WaterLog).filter(
        models.WaterLog.user_id == user_id,
        models.WaterLog.day == day
    ).all()
    return sum(log.amount_ml for log in logs)


def add_meal(db: Session, user_id: int, data: schemas.MealCreate) -> models.Meal:
    """Добавить прием пищи"""
    meal = models.Meal(user_id=user_id, **data.dict())
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


def delete_meal(db: Session, meal_id: int, user_id: int) -> bool:
    """Удалить прием пищи"""
    meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == user_id
    ).first()

    if meal:
        db.delete(meal)
        db.commit()
        return True
    return False


def log_water(db: Session, user_id: int, data: schemas.WaterLogCreate) -> models.WaterLog:
    """Добавить запись о воде"""
    water_log = models.WaterLog(user_id=user_id, **data.dict())
    db.add(water_log)
    db.commit()
    db.refresh(water_log)
    return water_log
