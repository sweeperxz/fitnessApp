"""
Сервисный слой для работы с профилями пользователей
"""
from sqlalchemy.orm import Session
from datetime import date
import models, schemas


def calculate_goals(weight: float, goal: str, activity: str) -> dict:
    """Расчет целей по КБЖУ на основе параметров пользователя"""
    protein = round(weight * 2)
    fat = round(weight)

    # BMR по формуле Миффлина-Сан Жеора (упрощенная)
    bmr = weight * 10 + 6.25 * 175 - 5 * 30 + 5

    # TDEE с учетом активности
    activity_multipliers = {
        'low': 1.2,
        'medium': 1.55,
        'high': 1.725
    }
    tdee = bmr * activity_multipliers.get(activity, 1.55)

    # Корректировка под цель
    if goal == 'lose':
        tdee -= 400
    elif goal == 'gain':
        tdee += 300

    calories = round(tdee)
    carbs = max(round((calories - protein * 4 - fat * 9) / 4), 50)
    water = round(weight * 30)

    return {
        'calories_goal': calories,
        'protein_goal': protein,
        'fat_goal': fat,
        'carbs_goal': carbs,
        'water_goal': water
    }


def get_user_profile(db: Session, user_id: int) -> models.Profile:
    """Получить профиль пользователя"""
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()


def create_or_update_profile(db: Session, user_id: int, data: schemas.ProfileCreate) -> models.Profile:
    """Создать или обновить профиль пользователя"""
    profile = get_user_profile(db, user_id)

    if profile:
        for key, value in data.dict().items():
            setattr(profile, key, value)
    else:
        profile = models.Profile(user_id=user_id, **data.dict())
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return profile
