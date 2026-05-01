"""
Идемпотентность POST /nutrition/meal и POST /nutrition/water через op_id.

Это критично для оффлайн-флоу: фронт ставит запись в очередь с op_id,
если запрос упал по сети, retry-механизм может проиграть тот же payload
повторно — должны не получить дубль в БД.
"""

import uuid
from datetime import date, timedelta

# `routers/nutrition.get_nutrition` отвергает даты вне `[today - 1 year, today]`,
# поэтому фиксированная дата вроде "2025-01-15" со временем перестанет
# проходить тесты. Берём вчера — заведомо в окне.
TEST_DAY = (date.today() - timedelta(days=1)).isoformat()


def test_meal_with_same_op_id_is_idempotent(client, make_user, auth_headers):
    user = make_user(email="idem-meal@example.com")
    headers = auth_headers(user.id)
    op_id = str(uuid.uuid4())

    payload = {
        "day": TEST_DAY,
        "meal_type": "breakfast",
        "name": "Овсянка",
        "calories": 350,
        "protein": 12,
        "fat": 6,
        "carbs": 60,
        "op_id": op_id,
    }

    first = client.post("/nutrition/meal", json=payload, headers=headers)
    assert first.status_code == 200, first.text
    second = client.post("/nutrition/meal", json=payload, headers=headers)
    assert second.status_code == 200, second.text

    assert first.json()["id"] == second.json()["id"]

    day_resp = client.get(f"/nutrition/{TEST_DAY}", headers=headers)
    assert day_resp.status_code == 200
    meals = day_resp.json()["meals"]
    assert len(meals) == 1, "duplicate meal must not be inserted"
    assert day_resp.json()["total_calories"] == 350


def test_water_log_with_same_op_id_is_idempotent(client, make_user, auth_headers):
    user = make_user(email="idem-water@example.com")
    headers = auth_headers(user.id)
    op_id = str(uuid.uuid4())

    payload = {"day": TEST_DAY, "amount_ml": 250, "op_id": op_id}

    first = client.post("/nutrition/water", json=payload, headers=headers)
    assert first.status_code == 200, first.text
    second = client.post("/nutrition/water", json=payload, headers=headers)
    assert second.status_code == 200, second.text

    assert first.json()["id"] == second.json()["id"]

    day_resp = client.get(f"/nutrition/{TEST_DAY}", headers=headers)
    assert day_resp.json()["water_ml"] == 250


def test_op_id_collision_across_resource_types_is_409(client, make_user, auth_headers):
    """
    Один и тот же op_id, использованный для meal-операции, не должен молча
    дать meal-результат при повторе как water (или наоборот) — это сигнал
    бага клиента, отвечаем 409.
    """
    user = make_user(email="op-collision@example.com")
    headers = auth_headers(user.id)
    op_id = str(uuid.uuid4())

    meal_resp = client.post(
        "/nutrition/meal",
        json={
            "day": TEST_DAY,
            "meal_type": "lunch",
            "name": "Курица",
            "calories": 400,
            "op_id": op_id,
        },
        headers=headers,
    )
    assert meal_resp.status_code == 200

    water_resp = client.post(
        "/nutrition/water",
        json={"day": TEST_DAY, "amount_ml": 200, "op_id": op_id},
        headers=headers,
    )
    assert water_resp.status_code == 409
    detail = water_resp.json()["detail"]
    assert detail["code"] == "OP_ID_CONFLICT"


def test_distinct_op_ids_create_separate_meals(client, make_user, auth_headers):
    user = make_user(email="distinct-ops@example.com")
    headers = auth_headers(user.id)

    base = {"day": TEST_DAY, "meal_type": "breakfast", "name": "Eggs", "calories": 200}
    a = client.post("/nutrition/meal", json={**base, "op_id": str(uuid.uuid4())}, headers=headers)
    b = client.post("/nutrition/meal", json={**base, "op_id": str(uuid.uuid4())}, headers=headers)
    assert a.status_code == 200 and b.status_code == 200
    assert a.json()["id"] != b.json()["id"]

    day_resp = client.get(f"/nutrition/{TEST_DAY}", headers=headers)
    assert len(day_resp.json()["meals"]) == 2
