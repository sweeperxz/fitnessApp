"""
Валидация лимитов воды: разовый и суточный.
"""

from datetime import date, timedelta

from routers.nutrition import MAX_DAILY_WATER_ML, MAX_SINGLE_WATER_INTAKE_ML

TEST_DAY = (date.today() - timedelta(days=1)).isoformat()


def test_single_intake_above_limit_is_rejected(client, make_user, auth_headers):
    user = make_user(email="water-single@example.com")
    headers = auth_headers(user.id)

    resp = client.post(
        "/nutrition/water",
        json={"day": TEST_DAY, "amount_ml": MAX_SINGLE_WATER_INTAKE_ML + 1},
        headers=headers,
    )
    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert detail["code"] == "WATER_SINGLE_LIMIT_EXCEEDED"
    assert detail["limit_ml"] == MAX_SINGLE_WATER_INTAKE_ML


def test_single_intake_at_limit_is_accepted(client, make_user, auth_headers):
    user = make_user(email="water-at-limit@example.com")
    headers = auth_headers(user.id)

    resp = client.post(
        "/nutrition/water",
        json={"day": TEST_DAY, "amount_ml": MAX_SINGLE_WATER_INTAKE_ML},
        headers=headers,
    )
    assert resp.status_code == 200


def test_cumulative_above_daily_limit_is_rejected(client, make_user, auth_headers):
    user = make_user(email="water-daily@example.com")
    headers = auth_headers(user.id)

    # MAX_DAILY_WATER_ML / MAX_SINGLE_WATER_INTAKE_ML = 5; сделаем 5 запросов вплотную к лимиту
    full_intakes = MAX_DAILY_WATER_ML // MAX_SINGLE_WATER_INTAKE_ML
    for _ in range(full_intakes):
        resp = client.post(
            "/nutrition/water",
            json={"day": TEST_DAY, "amount_ml": MAX_SINGLE_WATER_INTAKE_ML},
            headers=headers,
        )
        assert resp.status_code == 200

    overflow = client.post(
        "/nutrition/water",
        json={"day": TEST_DAY, "amount_ml": 1},
        headers=headers,
    )
    assert overflow.status_code == 400
    detail = overflow.json()["detail"]
    assert detail["code"] == "WATER_DAILY_LIMIT_EXCEEDED"
    assert detail["current_ml"] == MAX_DAILY_WATER_ML


def test_negative_amount_rejected_by_pydantic(client, make_user, auth_headers):
    user = make_user(email="water-neg@example.com")
    headers = auth_headers(user.id)

    resp = client.post(
        "/nutrition/water",
        json={"day": TEST_DAY, "amount_ml": -10},
        headers=headers,
    )
    assert resp.status_code == 422
