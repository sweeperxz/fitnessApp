"""
Регрессии на /workouts:
- N8: валидация диапазона from_date / to_date.
- N9: идемпотентность POST /workouts через op_id.
"""
from datetime import date, timedelta


def test_workouts_inverted_date_range_returns_400(client, make_user, auth_headers):
    user = make_user(email="w-bad-range@example.com")
    headers = auth_headers(user.id)
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    resp = client.get(
        f"/workouts?from_date={today}&to_date={yesterday}",
        headers=headers,
    )
    assert resp.status_code == 400


def test_workouts_too_wide_date_range_returns_400(client, make_user, auth_headers):
    user = make_user(email="w-wide-range@example.com")
    headers = auth_headers(user.id)
    today = date.today()
    long_ago = today - timedelta(days=400)

    resp = client.get(
        f"/workouts?from_date={long_ago.isoformat()}&to_date={today.isoformat()}",
        headers=headers,
    )
    assert resp.status_code == 400


def test_workouts_normal_date_range_works(client, make_user, auth_headers):
    user = make_user(email="w-ok-range@example.com")
    headers = auth_headers(user.id)
    today = date.today()
    week_ago = today - timedelta(days=7)

    resp = client.get(
        f"/workouts?from_date={week_ago.isoformat()}&to_date={today.isoformat()}",
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


def test_workouts_no_date_filter_is_unrestricted(client, make_user, auth_headers):
    """Без явного диапазона валидация не срабатывает (старое поведение)."""
    user = make_user(email="w-no-range@example.com")
    headers = auth_headers(user.id)
    resp = client.get("/workouts", headers=headers)
    assert resp.status_code == 200


def test_create_workout_idempotent_by_op_id(client, make_user, auth_headers):
    user = make_user(email="w-idempotent@example.com")
    headers = auth_headers(user.id)
    payload = {
        "day": date.today().isoformat(),
        "title": "Push day",
        "notes": "",
        "op_id": "fixed-op-id-12345",
        "exercises": [
            {"name": "Bench", "sets": 3, "reps": 10, "weight_kg": 60},
        ],
    }
    first = client.post("/workouts", json=payload, headers=headers)
    assert first.status_code == 200
    first_body = first.json()

    # Повторный запрос с тем же op_id не должен создать вторую запись —
    # отдаём ту же самую тренировку.
    second = client.post("/workouts", json=payload, headers=headers)
    assert second.status_code == 200
    second_body = second.json()
    assert first_body["id"] == second_body["id"]

    listing = client.get("/workouts", headers=headers).json()
    same_day_workouts = [w for w in listing if w["day"] == payload["day"]]
    assert len(same_day_workouts) == 1


def test_create_workout_without_op_id_creates_separate_rows(client, make_user, auth_headers):
    """Безопасно: если фронт не передал op_id, поведение прежнее — каждая
    отправка создаёт свою тренировку."""
    user = make_user(email="w-no-opid@example.com")
    headers = auth_headers(user.id)
    payload = {"day": date.today().isoformat(), "title": "Workout", "notes": ""}

    first = client.post("/workouts", json=payload, headers=headers)
    second = client.post("/workouts", json=payload, headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] != second.json()["id"]


def test_create_workout_op_id_collision_raises(client, make_user, auth_headers):
    """Тот же op_id повторно использованный для совершенно другого ресурса
    (например, op_id из add_meal) должен отклоняться, чтобы не пробивать
    кросс-ресурсную инвариантность дедупликации."""
    user = make_user(email="w-opid-collide@example.com")
    headers = auth_headers(user.id)

    meal_payload = {
        "day": date.today().isoformat(),
        "meal_type": "Breakfast",
        "name": "Oats",
        "op_id": "shared-op-id",
        "calories": 300,
    }
    r1 = client.post("/nutrition/meal", json=meal_payload, headers=headers)
    assert r1.status_code == 200

    workout_payload = {
        "day": date.today().isoformat(),
        "title": "Day",
        "notes": "",
        "op_id": "shared-op-id",
    }
    # Бэк должен заметить, что op_id уже использован для meal, и отказаться
    # создавать workout с тем же ключом.
    r2 = client.post("/workouts", json=workout_payload, headers=headers)
    assert r2.status_code == 409
    assert r2.json()["detail"]["code"] == "OP_ID_CONFLICT"
