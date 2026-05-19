from unittest.mock import patch, AsyncMock
import models

def test_add_custom_food_with_barcode(client, make_user, auth_headers):
    user = make_user(email="food-barcode@example.com")
    headers = auth_headers(user.id)

    # 1. Create a custom food item with a barcode
    food_data = {
        "name": "Тестовый Йогурт",
        "brand": "Молочная Фирма",
        "calories": 150,
        "protein": 5,
        "fat": 3,
        "carbs": 12,
        "barcode": "4820000111122"
    }

    resp = client.post("/foods/recent", json=food_data, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Тестовый Йогурт"
    assert data["barcode"] == "4820000111122"

    # 2. Look up the food by barcode (should hit the local DB and NOT call FatSecret API)
    with patch("services.fatsecret_service.get_food_by_barcode", new_callable=AsyncMock) as mock_get:
        lookup_resp = client.get("/foods/barcode/4820000111122", headers=headers)
        assert lookup_resp.status_code == 200
        lookup_data = lookup_resp.json()
        assert lookup_data["name"] == "Тестовый Йогурт"
        assert lookup_data["brand"] == "Молочная Фирма"
        assert lookup_data["calories"] == 150
        # FatSecret mock should NOT have been called because it was found locally
        mock_get.assert_not_called()


def test_search_combines_local_and_api(client, make_user, auth_headers):
    user = make_user(email="food-search@example.com")
    headers = auth_headers(user.id)

    # 1. Create a local food item
    client.post("/foods/recent", json={
        "name": "Малина Свежая",
        "brand": "Фермер",
        "calories": 40,
        "protein": 1,
        "fat": 0,
        "carbs": 8,
        "barcode": None
    }, headers=headers)

    # 2. Search for the food
    mock_api_results = [
        {
            "name": "Raspberry (API)",
            "brand": "Brand",
            "calories": 52,
            "protein": 1,
            "fat": 0,
            "carbs": 12,
            "barcode": None
        }
    ]

    with patch("services.fatsecret_service.search_foods", new_callable=AsyncMock, return_value=mock_api_results) as mock_search:
        resp = client.get("/foods/search?q=Малина", headers=headers)
        assert resp.status_code == 200
        results = resp.json()
        
        # Should contain both local food and API food
        names = [item["name"] for item in results]
        assert "Малина Свежая" in names
        assert "Raspberry (API)" in names
        mock_search.assert_called_once_with("Малина", 8, region=None)


def test_barcode_lookup_falls_back_to_api_and_caches_locally(client, db_session, make_user, auth_headers):
    user = make_user(email="food-cache@example.com")
    headers = auth_headers(user.id)

    mock_api_food = {
        "name": "API Snickers",
        "brand": "Mars",
        "calories": 250,
        "protein": 4,
        "fat": 12,
        "carbs": 33,
        "barcode": "5000159461122"
    }

    # Verify Snickers is not in DB initially
    assert db_session.query(models.UserFood).filter(models.UserFood.barcode == "5000159461122").first() is None

    # Look up barcode (not found in DB, fetches from API and caches)
    with patch("services.fatsecret_service.get_food_by_barcode", new_callable=AsyncMock, return_value=mock_api_food) as mock_get:
        resp = client.get("/foods/barcode/5000159461122", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "API Snickers"
        mock_get.assert_called_once()

    # Verify Snickers has been cached in the database as a global item (user_id is None)
    cached = db_session.query(models.UserFood).filter(models.UserFood.barcode == "5000159461122").first()
    assert cached is not None
    assert cached.name == "API Snickers"
    assert cached.user_id is None
