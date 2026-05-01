"""
Фоновая отправка Web Push уведомлений.

Вызывается из роутеров через `BackgroundTasks` (открывает свою DB-сессию,
чтобы не делить её с HTTP-обработчиком) или напрямую с уже-открытой
сессией из `/push/test` (см. `send_push_notification_using_session`).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

import crud
from config import settings
from database import SessionLocal

logger = logging.getLogger(__name__)

try:
    from pywebpush import WebPushException, webpush
except ImportError:  # pragma: no cover
    webpush = None
    WebPushException = Exception

# Согласно RFC 8030 push-сервис может вернуть 404 или 410, чтобы сигнализировать,
# что подписка больше не валидна. 410 — каноничный сигнал, но FCM иногда отдаёт
# 404, поэтому удаляем подписку в обоих случаях.
DEAD_SUBSCRIPTION_STATUSES: tuple[int, ...] = (404, 410)


@dataclass
class PushDispatchResult:
    """Сводка по одной отправке: сколько успешных/упавших/удалённых подписок."""

    sent: int = 0
    failed: int = 0
    removed: int = 0
    details: list[dict[str, Any]] = field(default_factory=list)

    @property
    def total(self) -> int:
        return self.sent + self.failed + self.removed


def is_push_configured() -> bool:
    return bool(webpush and settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY)


def _webpush_status(exc: BaseException) -> int | None:
    """Достать HTTP-статус из WebPushException — у него `.response` опционален."""
    response = getattr(exc, "response", None)
    return getattr(response, "status_code", None) if response is not None else None


def _dispatch(db: Session, subs, message: str) -> PushDispatchResult:
    """
    Отправить `message` всем `subs`, собрать статистику, удалить мёртвые
    подписки одним батч-коммитом в конце (а не по одной транзакции на штуку,
    как было раньше).
    """
    result = PushDispatchResult()
    to_delete = []

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
            result.sent += 1
            result.details.append({"endpoint": s.endpoint, "status": "sent"})
        except WebPushException as exc:
            status = _webpush_status(exc)
            if status in DEAD_SUBSCRIPTION_STATUSES:
                to_delete.append(s)
                result.removed += 1
                result.details.append(
                    {
                        "endpoint": s.endpoint,
                        "status": "removed",
                        "reason": f"subscription expired ({status})",
                    }
                )
            else:
                result.failed += 1
                result.details.append(
                    {
                        "endpoint": s.endpoint,
                        "status": "failed",
                        "http_status": status,
                        "error": str(exc),
                    }
                )
                logger.warning(
                    "push.delivery_failed endpoint=%s http_status=%s error=%s",
                    s.endpoint, status, exc,
                )
        except Exception as exc:  # noqa: BLE001 — pywebpush внутри может выбросить что угодно (cryptography, http_error)
            result.failed += 1
            result.details.append(
                {"endpoint": s.endpoint, "status": "failed", "error": str(exc)}
            )
            logger.exception("push.delivery_unexpected_error endpoint=%s", s.endpoint)

    if to_delete:
        for sub in to_delete:
            db.delete(sub)
        db.commit()

    return result


def send_push_notification_using_session(
    db: Session, user_id: int, message: str
) -> PushDispatchResult:
    """
    Отправить уведомление с уже-открытой DB-сессией. Используется в `/push/test`,
    где сессия пришла через `Depends(get_db)`.
    """
    if not is_push_configured():
        logger.debug("push.skipped reason=not_configured user_id=%s", user_id)
        return PushDispatchResult()

    subs = crud.get_push_subscriptions(db, user_id)
    if not subs:
        logger.debug("push.skipped reason=no_subscriptions user_id=%s", user_id)
        return PushDispatchResult()

    result = _dispatch(db, subs, message)
    logger.info(
        "push.dispatched user_id=%s sent=%d failed=%d removed=%d total=%d",
        user_id, result.sent, result.failed, result.removed, result.total,
    )
    return result


def send_push_notification(user_id: int, message: str) -> PushDispatchResult:
    """
    Отправить уведомление, открыв собственную DB-сессию. Подходит для вызова
    из FastAPI `BackgroundTasks` (фоновая задача не получает Depends-сессию).
    Возвращаемое значение фоновой задачей игнорируется, но мы всё равно его
    отдаём — для удобства тестов и переиспользования.
    """
    if not is_push_configured():
        logger.debug("push.skipped reason=not_configured user_id=%s", user_id)
        return PushDispatchResult()

    db = SessionLocal()
    try:
        return send_push_notification_using_session(db, user_id, message)
    finally:
        db.close()
