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
from services.push_service import WebPushException, is_push_configured, webpush

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

    results = []
    for s in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": s.endpoint,
                    "keys": {"p256dh": s.p256dh, "auth": s.auth},
                },
                data="Привет от Nutrio! Уведомления работают 🎉",
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_EMAIL},
            )
            results.append({"endpoint": s.endpoint, "status": "sent"})
        except WebPushException as ex:
            if ex.response and ex.response.status_code == 410:
                db.delete(s)
                db.commit()
                results.append(
                    {
                        "endpoint": s.endpoint,
                        "status": "removed",
                        "reason": "subscription expired (410)",
                    }
                )
            else:
                results.append(
                    {"endpoint": s.endpoint, "status": "failed", "error": str(ex)}
                )

    return {"ok": True, "results": results}
