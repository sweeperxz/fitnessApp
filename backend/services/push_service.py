"""
Фоновая отправка Web Push уведомлений.

Вызывается из роутеров через `BackgroundTasks`, поэтому открывает свою
собственную DB-сессию (а не получает её через Depends), чтобы не блокировать
HTTP-обработчик webpush()-запросом.
"""
from __future__ import annotations

import logging

import crud
from config import settings
from database import SessionLocal

logger = logging.getLogger(__name__)

try:
    from pywebpush import webpush, WebPushException
except ImportError:  # pragma: no cover
    webpush = None
    WebPushException = Exception


def is_push_configured() -> bool:
    return bool(webpush and settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY)


def send_push_notification(user_id: int, message: str) -> None:
    """Отправить push-уведомление всем активным подпискам пользователя."""
    if not is_push_configured():
        return
    db = SessionLocal()
    try:
        subs = crud.get_push_subscriptions(db, user_id)
        for s in subs:
            try:
                webpush(
                    subscription_info={
                        "endpoint": s.endpoint,
                        "keys": {"p256dh": s.p256dh, "auth": s.auth},
                    },
                    data=message,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": settings.VAPID_EMAIL},
                )
            except WebPushException as e:
                # Подписка устарела (410 Gone) — удаляем
                if e.response and e.response.status_code == 410:
                    db.delete(s)
                    db.commit()
            except Exception:
                logger.exception("Failed to send push notification")
    finally:
        db.close()
