"""
Тесты push-диспетчера: считаем sent/failed/removed, чистим мёртвые подписки
(410 + 404), не удаляем при 5xx, отдаём осмысленный ответ из /push/test.

`pywebpush.webpush` мокается на уровне модуля `services.push_service`,
чтобы тесты не пытались реально стучаться в FCM/Mozilla push.
"""
from unittest.mock import MagicMock

import pytest

import models
from services import push_service


def _make_subscription(db, user, endpoint="https://example.com/p/1"):
    sub = models.PushSubscription(
        user_id=user.id,
        endpoint=endpoint,
        p256dh="p" * 32,
        auth="a" * 16,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def _make_webpush_exception(status: int):
    response = MagicMock()
    response.status_code = status
    return push_service.WebPushException("simulated", response=response)


@pytest.fixture
def mock_webpush(monkeypatch):
    """Возвращает mock-объект, на котором тест может настроить `side_effect`."""
    mock = MagicMock(return_value=None)
    monkeypatch.setattr(push_service, "webpush", mock)
    monkeypatch.setattr(push_service, "is_push_configured", lambda: True)
    return mock


def test_no_subscriptions_returns_zero_and_skips_send(db_session, make_user, mock_webpush):
    user = make_user(email="nopush@example.com")
    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.sent == result.failed == result.removed == 0
    assert result.total == 0
    assert result.details == []
    mock_webpush.assert_not_called()


def test_active_subscription_increments_sent(db_session, make_user, mock_webpush):
    user = make_user(email="active@example.com")
    _make_subscription(db_session, user)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.sent == 1
    assert result.failed == 0
    assert result.removed == 0
    mock_webpush.assert_called_once()
    assert result.details == [
        {"endpoint": "https://example.com/p/1", "status": "sent"},
    ]


def test_410_removes_subscription(db_session, make_user, mock_webpush):
    user = make_user(email="gone@example.com")
    _make_subscription(db_session, user)
    mock_webpush.side_effect = _make_webpush_exception(410)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.removed == 1
    assert result.sent == 0
    assert result.failed == 0
    assert (
        db_session.query(models.PushSubscription).filter_by(user_id=user.id).count() == 0
    )


def test_404_also_removes_subscription(db_session, make_user, mock_webpush):
    """FCM иногда возвращает 404 вместо 410 — тоже считаем это «подписка мертва»."""
    user = make_user(email="notfound@example.com")
    _make_subscription(db_session, user)
    mock_webpush.side_effect = _make_webpush_exception(404)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.removed == 1
    assert (
        db_session.query(models.PushSubscription).filter_by(user_id=user.id).count() == 0
    )


def test_5xx_keeps_subscription_and_increments_failed(db_session, make_user, mock_webpush):
    user = make_user(email="err5xx@example.com")
    _make_subscription(db_session, user)
    mock_webpush.side_effect = _make_webpush_exception(503)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.failed == 1
    assert result.removed == 0
    assert result.sent == 0
    assert (
        db_session.query(models.PushSubscription).filter_by(user_id=user.id).count() == 1
    )


def test_unexpected_exception_counted_as_failed(db_session, make_user, mock_webpush):
    """Если pywebpush бросит не-WebPushException (например, из cryptography), не валим всю отправку."""
    user = make_user(email="unexpected@example.com")
    _make_subscription(db_session, user)
    mock_webpush.side_effect = ValueError("invalid VAPID key")

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.failed == 1
    assert (
        db_session.query(models.PushSubscription).filter_by(user_id=user.id).count() == 1
    )


def test_mixed_outcomes_aggregate_correctly(db_session, make_user, monkeypatch):
    """
    Три подписки: одна жива, одна 410, одна 503. Жива и 503 остаются,
    410 удаляется. Счётчики совпадают.
    """
    user = make_user(email="mixed@example.com")
    _make_subscription(db_session, user, endpoint="https://alive.example/")
    _make_subscription(db_session, user, endpoint="https://dead.example/")
    _make_subscription(db_session, user, endpoint="https://flaky.example/")

    def fake_webpush(subscription_info, **kwargs):
        endpoint = subscription_info["endpoint"]
        if endpoint == "https://alive.example/":
            return None
        if endpoint == "https://dead.example/":
            raise _make_webpush_exception(410)
        if endpoint == "https://flaky.example/":
            raise _make_webpush_exception(503)
        raise AssertionError(f"unexpected endpoint {endpoint}")

    monkeypatch.setattr(push_service, "webpush", fake_webpush)
    monkeypatch.setattr(push_service, "is_push_configured", lambda: True)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.sent == 1
    assert result.removed == 1
    assert result.failed == 1
    assert result.total == 3

    remaining = {
        s.endpoint
        for s in db_session.query(models.PushSubscription).filter_by(user_id=user.id).all()
    }
    assert remaining == {"https://alive.example/", "https://flaky.example/"}


def test_skipped_when_not_configured(db_session, make_user, monkeypatch):
    user = make_user(email="not-cfg@example.com")
    _make_subscription(db_session, user)
    monkeypatch.setattr(push_service, "is_push_configured", lambda: False)
    sentinel = MagicMock()
    monkeypatch.setattr(push_service, "webpush", sentinel)

    result = push_service.send_push_notification_using_session(db_session, user.id, "hi")
    assert result.total == 0
    sentinel.assert_not_called()


def test_logs_summary(db_session, make_user, mock_webpush, caplog):
    user = make_user(email="log@example.com")
    _make_subscription(db_session, user, endpoint="https://e1/")
    _make_subscription(db_session, user, endpoint="https://e2/")
    mock_webpush.side_effect = [None, _make_webpush_exception(410)]

    import logging
    with caplog.at_level(logging.INFO, logger="services.push_service"):
        push_service.send_push_notification_using_session(db_session, user.id, "hi")

    summary = [r for r in caplog.records if "push.dispatched" in r.getMessage()]
    assert len(summary) == 1
    msg = summary[0].getMessage()
    assert f"user_id={user.id}" in msg
    assert "sent=1" in msg
    assert "removed=1" in msg
    assert "total=2" in msg


def test_push_test_endpoint_returns_aggregated_response(
    client, make_user, auth_headers, db_session, mock_webpush
):
    """`/push/test` теперь отдаёт sent/failed/removed/total + per-endpoint details."""
    user = make_user(email="endpoint@example.com")
    _make_subscription(db_session, user, endpoint="https://e1.example/")
    _make_subscription(db_session, user, endpoint="https://e2.example/")
    # одна жива, вторая 410
    mock_webpush.side_effect = [None, _make_webpush_exception(410)]

    resp = client.post("/push/test", headers=auth_headers(user.id))
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["ok"] is True
    assert payload["sent"] == 1
    assert payload["removed"] == 1
    assert payload["failed"] == 0
    assert payload["total"] == 2
    assert len(payload["results"]) == 2
    statuses = {r["status"] for r in payload["results"]}
    assert statuses == {"sent", "removed"}


def test_push_test_endpoint_404_when_no_subscriptions(
    client, make_user, auth_headers, mock_webpush
):
    user = make_user(email="empty@example.com")
    resp = client.post("/push/test", headers=auth_headers(user.id))
    assert resp.status_code == 404
