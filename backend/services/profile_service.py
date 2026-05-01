"""
Сервисный слой для работы с профилями пользователей.

Делегирует CRUD в `crud.py`, чтобы централизованно управлять кешем профиля
и не плодить параллельные пути доступа к данным.

Расчёт КБЖУ — в `services.nutrition_calculator`.
"""
from sqlalchemy.orm import Session

import crud
import models
import schemas


def get_user_profile(db: Session, user_id: int) -> models.Profile:
    """Получить профиль пользователя (через crud, с учётом кеша)."""
    return crud.get_profile(db, user_id)


def create_or_update_profile(db: Session, user_id: int, data: schemas.ProfileCreate) -> models.Profile:
    """Создать или обновить профиль пользователя (с инвалидацией кеша)."""
    return crud.upsert_profile(db, user_id, data)
