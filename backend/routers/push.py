"""
Web Push: получение публичного VAPID ключа, подписка, тестовая отправка.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_current_user, get_db
from config import settings
from services.push_service import (
    is_push_configured,
    send_push_notification_using_session,
    webpush,
)

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public-key")
def get_vapid_public_key():
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(500, "VAPID_PUBLIC_KEY не настроен")
    return {"public_key": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
def subscribe(
    data: schemas.PushSubscriptionCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    crud.subscribe_push(db, user.id, data)
    return {"ok": True}


@router.delete("/subscribe")
def unsubscribe(
    data: schemas.PushSubscriptionDelete,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Явный отказ от уведомлений. Фронт должен вызывать после
    `subscription.unsubscribe()` в браузере, чтобы строка в БД сразу
    удалялась, а не висела до первой неудачной попытки отправки.

    Возвращаем 200 в обоих случаях (нашли/не нашли) — клиенту фактически
    важно "после этого вызова сабскрипшен в БД отсутствует". 404 здесь
    больше создаст путаницы (race condition: кто-то уже почистил по 410).
    """
    removed = crud.delete_push_subscription(db, user.id, data.endpoint)
    return {"ok": True, "removed": removed}


@router.post("/test")
def test_push(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if webpush is None:
        raise HTTPException(500, "библиотека pywebpush не установлена")
    if not is_push_configured():
        raise HTTPException(
            500,
            "VAPID ключи не настроены. Добавьте VAPID_PRIVATE_KEY и VAPID_PUBLIC_KEY в .env",
        )

    subs = crud.get_push_subscriptions(db, user.id)
    if not subs:
        raise HTTPException(404, "Подписки не найдены. Сначала включи уведомления в профиле.")

    result = send_push_notification_using_session(
        db, user.id, "Привет от Nutrio! Уведомления работают 🎉"
    )
    return {
        "ok": True,
        "sent": result.sent,
        "failed": result.failed,
        "removed": result.removed,
        "total": result.total,
        "results": result.details,
    }
