import httpx
import base64
import re
import time
import logging
from typing import Any
from fastapi import HTTPException

from config import settings

logger = logging.getLogger(__name__)

TOKEN_URL = "https://oauth.fatsecret.com/connect/token"
API_URL = "https://platform.fatsecret.com/rest/server.api"
DEFAULT_REGION = "default"
REGION_PARAMS = {
    "default": {},
    "us": {"region": "US"},
    "ua": {"region": "UA"},
    "uk": {"region": "GB"},
    "fr": {"region": "FR", "language": "fr"},
    "de": {"region": "DE", "language": "de"},
    "it": {"region": "IT", "language": "it"},
    "es": {"region": "ES", "language": "es"},
    "ca": {"region": "CA", "language": "en"},
    "au": {"region": "AU", "language": "en"},
    "nz": {"region": "NZ", "language": "en"},
    "ie": {"region": "IE", "language": "en"},
    "in": {"region": "IN", "language": "en"},
    "sg": {"region": "SG", "language": "en"},
    "za": {"region": "ZA", "language": "en"},
}

CYRILLIC_RE = re.compile(r"[А-Яа-яЁёІіЇїЄєҐґ]")
UA_LANGUAGE_FALLBACKS = ("uk", "ru")
ENGLISH_LANGUAGE_REGIONS = {"us", "uk", "ca", "au", "nz", "ie", "in", "sg", "za"}



_cached_token: str | None = None
_cached_token_expire_at: float = 0


def _as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _pick_serving(servings_block: Any) -> dict[str, Any] | None:
    if not isinstance(servings_block, dict):
        return None

    servings = _as_list(servings_block.get("serving"))
    if not servings:
        return None

    default_serving = next((s for s in servings if str(s.get("is_default", "")) == "1"), None)
    if default_serving:
        return default_serving

    return servings[0] if isinstance(servings[0], dict) else None


def _build_food_item(raw_food: dict[str, Any], calories: float, protein: float, fat: float, carbs: float) -> dict[str, Any] | None:
    item = {
        "name": raw_food.get("food_name") or "Без названия",
        "brand": raw_food.get("brand_name") or "",
        "calories": round(calories),
        "protein": round(protein),
        "fat": round(fat),
        "carbs": round(carbs),
    }

    if item["calories"] <= 0:
        return None

    return item


def _normalize_serving_food(raw_food: dict[str, Any]) -> dict[str, Any] | None:
    serving = _pick_serving(raw_food.get("servings"))
    if not serving:
        return None

    calories = _to_float(serving.get("calories"))
    protein = _to_float(serving.get("protein"))
    fat = _to_float(serving.get("fat"))
    carbs = _to_float(serving.get("carbohydrate"))

    metric_amount = _to_float(serving.get("metric_serving_amount"))
    metric_unit = str(serving.get("metric_serving_unit", "")).lower()

    if metric_amount > 0 and metric_unit == "g":
        ratio = 100.0 / metric_amount
        calories *= ratio
        protein *= ratio
        fat *= ratio
        carbs *= ratio

    return _build_food_item(raw_food, calories, protein, fat, carbs)


def _normalize_search_description_food(raw_food: dict[str, Any]) -> dict[str, Any] | None:
    description = str(raw_food.get("food_description") or "")
    if not description:
        return None

    calories_match = re.search(r"Per\s+100\s*g\s*-\s*Calories:\s*([\d.]+)", description, re.IGNORECASE)
    protein_match = re.search(r"Protein:\s*([\d.]+)\s*g", description, re.IGNORECASE)
    fat_match = re.search(r"Fat:\s*([\d.]+)\s*g", description, re.IGNORECASE)
    carbs_match = re.search(r"Carbs?:\s*([\d.]+)\s*g", description, re.IGNORECASE)

    calories = _to_float(calories_match.group(1) if calories_match else None)
    protein = _to_float(protein_match.group(1) if protein_match else None)
    fat = _to_float(fat_match.group(1) if fat_match else None)
    carbs = _to_float(carbs_match.group(1) if carbs_match else None)

    return _build_food_item(raw_food, calories, protein, fat, carbs)


def _normalize_food(raw_food: dict[str, Any]) -> dict[str, Any] | None:
    return _normalize_serving_food(raw_food) or _normalize_search_description_food(raw_food)


def _extract_food_id(raw_food: dict[str, Any]) -> str | None:
    food_id = raw_food.get("food_id")
    if food_id:
        return str(food_id)
    return None


async def _hydrate_search_food(raw_food: dict[str, Any]) -> dict[str, Any] | None:
    item = _normalize_food(raw_food)
    if item:
        return item

    food_id = _extract_food_id(raw_food)
    if not food_id:
        return None

    food_payload = await _fatsecret_call({
        "method": "food.get",
        "food_id": food_id,
    })
    food = food_payload.get("food")
    if not isinstance(food, dict):
        return None

    return _normalize_food(food)


async def _extract_foods_from_search_response(payload: dict[str, Any], limit: int) -> list[dict[str, Any]]:
    foods_root = payload.get("foods") or payload.get("foods_search") or {}
    results_root = foods_root.get("results") if isinstance(foods_root, dict) else None

    foods = _as_list(
        (results_root.get("food") if isinstance(results_root, dict) else None)
        or (foods_root.get("food") if isinstance(foods_root, dict) else None)
    )

    normalized: list[dict[str, Any]] = []
    for food in foods:
        if not isinstance(food, dict):
            continue
        item = await _hydrate_search_food(food)
        if item:
            normalized.append(item)
        if len(normalized) >= limit:
            break
    return normalized


def _extract_food_id_from_barcode_response(payload: dict[str, Any]) -> str | None:
    root = payload.get("food_id_for_barcode") or payload.get("food") or payload
    if isinstance(root, dict):
        food_id = root.get("food_id") or root.get("value")
        if food_id:
            return str(food_id)
    if isinstance(root, str) and root.strip():
        return root.strip()
    return None




def normalize_region(region: str | None) -> str:
    value = str(region or DEFAULT_REGION).strip().lower()
    return value if value in REGION_PARAMS else DEFAULT_REGION


def _contains_cyrillic(text: str) -> bool:
    return bool(CYRILLIC_RE.search(text))


def _build_search_attempts(query: str, limit: int, region: str | None) -> list[dict[str, Any]]:
    normalized_region = normalize_region(region)
    base_params = {
        "method": "foods.search",
        "search_expression": query,
        "max_results": limit,
        "page_number": 0,
    }

    attempts: list[dict[str, Any]] = []

    primary_params = {**base_params, **REGION_PARAMS[normalized_region]}
    attempts.append(primary_params)

    if normalized_region == "ua" and _contains_cyrillic(query):
        for language in UA_LANGUAGE_FALLBACKS:
            params = {**base_params, "region": "UA", "language": language}
            if params not in attempts:
                attempts.append(params)

    if normalized_region in ENGLISH_LANGUAGE_REGIONS:
        params = {**base_params, **REGION_PARAMS[normalized_region], "language": "en"}
        if params not in attempts:
            attempts.append(params)

    if base_params not in attempts:
        attempts.append(base_params)

    return attempts


async def _get_access_token() -> str:
    global _cached_token, _cached_token_expire_at

    now = time.time()
    if _cached_token and now < _cached_token_expire_at:
        return _cached_token

    client_id = settings.FATSECRET_CLIENT_ID
    client_secret = settings.FATSECRET_CLIENT_SECRET

    if not client_id or not client_secret:
        raise HTTPException(500, "FatSecret credentials are not configured")

    auth_bytes = f"{client_id}:{client_secret}".encode("utf-8")
    auth_header = base64.b64encode(auth_bytes).decode("utf-8")

    form_data = {"grant_type": "client_credentials"}
    if settings.FATSECRET_SCOPE:
        form_data["scope"] = settings.FATSECRET_SCOPE

    headers = {
        "Authorization": f"Basic {auth_header}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(TOKEN_URL, data=form_data, headers=headers)

    if response.status_code >= 400:
        raise HTTPException(502, "FatSecret auth failed")

    data = response.json()
    token = data.get("access_token")
    expires_in = int(data.get("expires_in") or 0)

    if not token:
        raise HTTPException(502, "FatSecret token is missing")

    ttl = max(60, expires_in - 60) if expires_in > 0 else 300
    _cached_token = token
    _cached_token_expire_at = now + ttl
    return token


async def _fatsecret_call(params: dict[str, Any]) -> dict[str, Any]:
    token = await _get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(API_URL, data={**params, "format": "json"}, headers=headers)

    if response.status_code >= 400:
        raise HTTPException(502, "FatSecret request failed")

    res_json = response.json()

    # Fallback if account doesn't support Premium Localization
    if isinstance(res_json, dict) and "error" in res_json:
        err = res_json.get("error", {})
        err_msg = err.get("message", "")
        if "localization" in err_msg.lower() or "premium feature" in err_msg.lower():
            clean_params = {k: v for k, v in params.items() if k not in ("region", "language")}
            if clean_params != params:
                logger.info("FatSecret account does not support localization. Retrying without region/language.")
                async with httpx.AsyncClient(timeout=20.0) as retry_client:
                    retry_res = await retry_client.post(API_URL, data={**clean_params, "format": "json"}, headers=headers)
                if retry_res.status_code < 400:
                    return retry_res.json()

    return res_json


GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


def _get_target_lang(region: str | None, query: str | None = None) -> str | None:
    if region:
        r = region.lower()
        if r == "ua":
            return "Ukrainian"
        if r == "ru":
            return "Russian"
    if query and _contains_cyrillic(query):
        return "Ukrainian"
    return None


async def _translate_with_gemini(text: str, target_lang: str) -> str:
    if not settings.GEMINI_API_KEY or not text.strip():
        return text

    prompt = f"Translate the following food product name or search query to {target_lang}. Return ONLY the direct translation, nothing else, no comments or prefixes:\n{text}"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 100}
    }
    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(GEMINI_URL, json=payload, headers=headers, timeout=10.0)
            res.raise_for_status()
            data = res.json()
            translated = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if translated:
                return translated
        except Exception as e:
            logger.error(f"Gemini translation failed: {e}")
    return text


async def _translate_food_items(items: list[dict[str, Any]], target_lang: str) -> list[dict[str, Any]]:
    if not settings.GEMINI_API_KEY or not items:
        return items

    names_to_translate = []
    for idx, item in enumerate(items):
        names_to_translate.append(f"{idx}: {item.get('name', '')}")
        if item.get("brand"):
            names_to_translate.append(f"{idx}_brand: {item.get('brand', '')}")

    names_block = "\n".join(names_to_translate)
    prompt = (
        f"You are a professional nutrition translator. "
        f"Translate the following list of food names and brands to {target_lang}. "
        f"Maintain the exact format (index: translated_text). "
        f"Return ONLY the translated list. Do not explain or add introduction.\n\n"
        f"{names_block}"
    )

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2000}
    }
    headers = {
        "x-goog-api-key": settings.GEMINI_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(GEMINI_URL, json=payload, headers=headers, timeout=15.0)
            res.raise_for_status()
            data = res.json()
            translated_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            translations = {}
            for line in translated_text.split("\n"):
                if ":" in line:
                    parts = line.split(":", 1)
                    if len(parts) == 2:
                        key, val = parts
                        translations[key.strip()] = val.strip()

            for idx, item in enumerate(items):
                key = str(idx)
                brand_key = f"{idx}_brand"
                if key in translations:
                    item["name"] = translations[key]
                if brand_key in translations:
                    item["brand"] = translations[brand_key]
        except Exception as e:
            logger.error(f"Gemini batch translation failed: {e}")
    return items


async def search_foods(query: str, limit: int = 8, region: str | None = None) -> list[dict[str, Any]]:
    normalized_limit = max(1, min(limit, 50))
    target_lang = _get_target_lang(region, query)

    # Translate query to English if it contains Cyrillic characters
    search_query = query
    if target_lang and _contains_cyrillic(query):
        search_query = await _translate_with_gemini(query, "English")

    for params in _build_search_attempts(search_query, normalized_limit, region):
        payload = await _fatsecret_call(params)
        items = await _extract_foods_from_search_response(payload, normalized_limit)
        if items:
            if target_lang:
                items = await _translate_food_items(items, target_lang)
            return items

    return []


async def get_food_by_barcode(barcode: str, region: str | None = None) -> dict[str, Any] | None:
    normalized_region = normalize_region(region)
    region_params = REGION_PARAMS[normalized_region]

    payload = await _fatsecret_call({
        "method": "food.find_id_for_barcode",
        "barcode": barcode,
        **region_params
    })
    food_id = _extract_food_id_from_barcode_response(payload)
    if not food_id:
        return None

    food_payload = await _fatsecret_call({
        "method": "food.get",
        "food_id": food_id,
        **region_params
    })

    raw_food = food_payload.get("food")
    if not isinstance(raw_food, dict):
        return None

    food_item = _normalize_food(raw_food)
    if not food_item:
        return None

    # Translate the food item to the target language
    target_lang = _get_target_lang(region)
    if target_lang:
        translated_items = await _translate_food_items([food_item], target_lang)
        if translated_items:
            food_item = translated_items[0]

    return food_item
