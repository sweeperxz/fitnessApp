"""
PR #9 (B6): DELETE /push/subscribe — явный отказ от уведомлений.
Раньше фронт делал только subscription.unsubscribe() в браузере, а
строка в БД продолжала висеть до первой неудачной попытки отправки
(когда send_push_* подчищал мёртвые подписки по 404/410).
"""
import models


def _make_sub(db, user, endpoint):
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


def test_unsubscribe_removes_subscription(client, db_session, make_user, auth_headers):
    user = make_user(email="unsub@example.com")
    endpoint = "https://example.com/p/abc"
    _make_sub(db_session, user, endpoint)
    assert db_session.query(models.PushSubscription).count() == 1

    resp = client.request(
        "DELETE",
        "/push/subscribe",
        json={"endpoint": endpoint},
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["removed"] is True
    assert db_session.query(models.PushSubscription).count() == 0


def test_unsubscribe_with_unknown_endpoint_returns_ok_false(client, make_user, auth_headers):
    user = make_user(email="unsub-noop@example.com")
    resp = client.request(
        "DELETE",
        "/push/subscribe",
        json={"endpoint": "https://example.com/p/never-existed"},
        headers=auth_headers(user.id),
    )
    # Не 404 — клиенту достаточно, что после вызова в БД ничего нет.
    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "removed": False}


def test_unsubscribe_does_not_touch_other_users_subscriptions(client, db_session, make_user, auth_headers):
    """Юзер А не может удалить подписку юзера B одинаковым endpoint'ом."""
    user_a = make_user(email="a@example.com")
    user_b = make_user(email="b@example.com")
    endpoint = "https://example.com/p/shared-trick"
    _make_sub(db_session, user_b, endpoint)

    resp = client.request(
        "DELETE",
        "/push/subscribe",
        json={"endpoint": endpoint},
        headers=auth_headers(user_a.id),
    )
    assert resp.status_code == 200
    assert resp.json()["removed"] is False
    # Подписка B на месте.
    assert db_session.query(models.PushSubscription).count() == 1


def test_unsubscribe_requires_auth(client):
    resp = client.request(
        "DELETE",
        "/push/subscribe",
        json={"endpoint": "https://example.com/p/anon"},
    )
    assert resp.status_code in (401, 403)


def test_unsubscribe_validates_payload(client, make_user, auth_headers):
    user = make_user(email="unsub-bad@example.com")
    resp = client.request(
        "DELETE",
        "/push/subscribe",
        json={},  # нет endpoint
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 422
