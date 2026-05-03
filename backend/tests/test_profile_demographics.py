"""
PR #7 (B2): Profile.height / age / gender теперь персистятся в БД и используются
при пересчёте целей. Раньше эти параметры терялись после онбординга и
ProfilePage хардкодил 175см / 30лет / male.
"""
import pytest


# ── ProfileCreate accepts height/age/gender ───────────────
def test_upsert_profile_persists_demographics(client, make_user, auth_headers):
    user = make_user(email="demo@example.com")
    payload = {
        "weight": 65,
        "height": 162,
        "age": 28,
        "gender": "female",
        "goal": "maintain",
        "activity": "medium",
        "water_goal": 2200,
        "calories_goal": 1800,
        "protein_goal": 110,
        "fat_goal": 60,
        "carbs_goal": 200,
    }
    resp = client.post("/profile", json=payload, headers=auth_headers(user.id))
    assert resp.status_code == 200
    body = resp.json()
    assert body["height"] == 162
    assert body["age"] == 28
    assert body["gender"] == "female"

    # И на GET тоже отдаются
    resp_get = client.get("/profile", headers=auth_headers(user.id))
    assert resp_get.status_code == 200
    got = resp_get.json()
    assert got["height"] == 162
    assert got["age"] == 28
    assert got["gender"] == "female"


def test_upsert_profile_allows_null_demographics(client, make_user, auth_headers):
    """Старые юзеры (до миграции 0008) могут сохранять профиль без height/age/gender."""
    user = make_user(email="noheight@example.com")
    resp = client.post(
        "/profile",
        json={
            "weight": 70,
            "goal": "maintain",
            "activity": "medium",
            "water_goal": 2500,
            "calories_goal": 2000,
            "protein_goal": 150,
            "fat_goal": 70,
            "carbs_goal": 250,
        },
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["height"] is None
    assert body["age"] is None
    assert body["gender"] is None


def test_upsert_profile_rejects_garbage_gender(client, make_user, auth_headers):
    user = make_user(email="badgender@example.com")
    resp = client.post(
        "/profile",
        json={
            "weight": 70,
            "gender": "alien",
            "goal": "maintain",
            "activity": "medium",
            "water_goal": 2500,
            "calories_goal": 2000,
            "protein_goal": 150,
            "fat_goal": 70,
            "carbs_goal": 250,
        },
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 422


# ── /profile/calculate-goals: height/age/gender обязательны ──────
def test_calculate_goals_requires_height(client, make_user, auth_headers):
    user = make_user(email="cg-h@example.com")
    resp = client.post(
        "/profile/calculate-goals",
        json={"weight": 70, "age": 30, "gender": "male", "goal": "maintain", "activity": "medium"},
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 422


def test_calculate_goals_requires_age(client, make_user, auth_headers):
    user = make_user(email="cg-a@example.com")
    resp = client.post(
        "/profile/calculate-goals",
        json={"weight": 70, "height": 175, "gender": "male", "goal": "maintain", "activity": "medium"},
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 422


def test_calculate_goals_requires_gender(client, make_user, auth_headers):
    user = make_user(email="cg-g@example.com")
    resp = client.post(
        "/profile/calculate-goals",
        json={"weight": 70, "height": 175, "age": 30, "goal": "maintain", "activity": "medium"},
        headers=auth_headers(user.id),
    )
    assert resp.status_code == 422


@pytest.mark.parametrize(
    "h1,a1,g1,h2,a2,g2",
    [
        (160, 25, "female", 190, 35, "male"),  # женщина 160см vs мужчина 190см
    ],
)
def test_calculate_goals_uses_demographics(client, make_user, auth_headers, h1, a1, g1, h2, a2, g2):
    """Регрессия для B2: разные height/age/gender → разные cals/macros."""
    user = make_user(email="cg-diff@example.com")
    headers = auth_headers(user.id)
    base = {"weight": 70, "goal": "maintain", "activity": "medium"}
    r1 = client.post(
        "/profile/calculate-goals",
        json={**base, "height": h1, "age": a1, "gender": g1},
        headers=headers,
    )
    r2 = client.post(
        "/profile/calculate-goals",
        json={**base, "height": h2, "age": a2, "gender": g2},
        headers=headers,
    )
    assert r1.status_code == 200
    assert r2.status_code == 200
    cals1 = r1.json()["calories_goal"]
    cals2 = r2.json()["calories_goal"]
    # Разные параметры — разные цели; раньше всегда возвращались одинаковые,
    # потому что height=175, age=30, gender=male уходили хардкодом с фронта.
    assert cals1 != cals2
