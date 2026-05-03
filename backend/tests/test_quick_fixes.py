"""
Быстрые фиксы багов (PR #6):
- B1: /nutrition/{day} не должен крашиться 29 февраля.
- B3: DELETE meal/workout — 404 на чужое/несуществующее.
- B4: EmailStr валидация в register/login.
- B8: /admin/users — валидация skip/limit.
"""
from datetime import date, timedelta
from unittest.mock import patch


# ── B1: Feb 29 / "ровно год назад" ─────────────────────────
def test_nutrition_day_does_not_crash_on_leap_day(client, make_user, auth_headers):
    """
    Регрессия для today.replace(year=today.year-1) на 29 февраля високосного.
    Подсовываем фейковый today=2024-02-29, ручка должна корректно ответить
    (не крашнуться на ValueError при вычислении границы окна).
    """
    user = make_user(email="leap@example.com")

    leap_today = date(2024, 2, 29)
    requested_day = leap_today  # данные за сам сегодня
    with patch("routers.nutrition.date") as mock_date:
        mock_date.today.return_value = leap_today
        # date(...) сам должен работать как обычно
        mock_date.side_effect = lambda *a, **kw: date(*a, **kw)
        resp = client.get(
            f"/nutrition/{requested_day.isoformat()}",
            headers=auth_headers(user.id),
        )
    assert resp.status_code == 200
    assert resp.json()["day"] == requested_day.isoformat()


def test_nutrition_history_window_is_365_days(client, make_user, auth_headers):
    """365-дневное окно — день старше 365 дней назад отвергается 400."""
    user = make_user(email="window@example.com")
    too_old = date.today() - timedelta(days=400)
    resp = client.get(
        f"/nutrition/{too_old.isoformat()}",
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 400


# ── B3: DELETE 404 ────────────────────────────────────────
def test_delete_nonexistent_meal_returns_404(client, make_user, auth_headers):
    user = make_user(email="meal-del@example.com")
    resp = client.delete("/nutrition/meal/9999", headers=auth_headers(user.id))
    assert resp.status_code == 404


def test_delete_other_users_meal_returns_404(client, db_session, make_user, auth_headers):
    """IDOR-проверка: чужую еду удалять нельзя; ответ — 404, а не 200."""
    import models

    owner = make_user(email="owner@example.com")
    intruder = make_user(email="intruder@example.com")
    meal = models.Meal(
        user_id=owner.id,
        day=date.today(),
        meal_type="breakfast",
        name="oats",
    )
    db_session.add(meal)
    db_session.commit()
    db_session.refresh(meal)

    resp = client.delete(
        f"/nutrition/meal/{meal.id}", headers=auth_headers(intruder.id)
    )
    assert resp.status_code == 404

    # И запись на месте
    still = db_session.query(models.Meal).filter_by(id=meal.id).first()
    assert still is not None


def test_delete_own_meal_returns_200(client, db_session, make_user, auth_headers):
    import models

    user = make_user(email="meal-ok@example.com")
    meal = models.Meal(
        user_id=user.id, day=date.today(), meal_type="lunch", name="rice"
    )
    db_session.add(meal)
    db_session.commit()
    db_session.refresh(meal)

    resp = client.delete(
        f"/nutrition/meal/{meal.id}", headers=auth_headers(user.id)
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


def test_delete_nonexistent_workout_returns_404(client, make_user, auth_headers):
    user = make_user(email="wo-del@example.com")
    resp = client.delete("/workouts/9999", headers=auth_headers(user.id))
    assert resp.status_code == 404


def test_delete_other_users_workout_returns_404(client, db_session, make_user, auth_headers):
    import models

    owner = make_user(email="wo-owner@example.com")
    intruder = make_user(email="wo-intruder@example.com")
    w = models.Workout(user_id=owner.id, day=date.today(), title="legs")
    db_session.add(w)
    db_session.commit()
    db_session.refresh(w)

    resp = client.delete(f"/workouts/{w.id}", headers=auth_headers(intruder.id))
    assert resp.status_code == 404


# ── B4: EmailStr ──────────────────────────────────────────
def test_register_rejects_garbage_email(client):
    resp = client.post(
        "/auth/register",
        json={"email": "not-an-email", "password": "Passw0rd!", "name": "x"},
    )
    assert resp.status_code == 422


def test_login_rejects_garbage_email(client):
    resp = client.post(
        "/auth/login",
        json={"email": "no-at-symbol", "password": "Passw0rd!"},
    )
    assert resp.status_code == 422


def test_register_accepts_valid_email(client):
    resp = client.post(
        "/auth/register",
        json={"email": "valid@example.com", "password": "Passw0rd!", "name": "Valid"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "valid@example.com"


# ── B8: /admin/users skip/limit ───────────────────────────
def test_admin_users_rejects_negative_skip(client, make_user, auth_headers):
    admin = make_user(email="adm-skip@example.com", role="admin")
    resp = client.get("/admin/users?skip=-1", headers=auth_headers(admin.id))
    assert resp.status_code == 422


def test_admin_users_rejects_zero_limit(client, make_user, auth_headers):
    admin = make_user(email="adm-limit0@example.com", role="admin")
    resp = client.get("/admin/users?limit=0", headers=auth_headers(admin.id))
    assert resp.status_code == 422


def test_admin_users_caps_limit_at_100(client, make_user, auth_headers):
    admin = make_user(email="adm-caplim@example.com", role="admin")
    resp = client.get("/admin/users?limit=500", headers=auth_headers(admin.id))
    assert resp.status_code == 422
