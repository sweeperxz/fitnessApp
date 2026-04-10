from functools import lru_cache
from datetime import datetime, timedelta
from typing import Optional
import models

# Простий in-memory кеш для профілів
_profile_cache = {}
_cache_ttl = timedelta(minutes=5)

class CachedProfile:
    def __init__(self, profile, timestamp):
        self.profile = profile
        self.timestamp = timestamp

    def is_expired(self):
        return datetime.utcnow() - self.timestamp > _cache_ttl

def get_cached_profile(user_id: int) -> Optional[models.Profile]:
    """Отримує профіль з кешу якщо він не застарів"""
    cached = _profile_cache.get(user_id)
    if cached and not cached.is_expired():
        return cached.profile
    return None

def set_cached_profile(user_id: int, profile: models.Profile):
    """Зберігає профіль в кеш"""
    _profile_cache[user_id] = CachedProfile(profile, datetime.utcnow())

def invalidate_profile_cache(user_id: int):
    """Видаляє профіль з кешу (викликається при оновленні)"""
    _profile_cache.pop(user_id, None)

def clear_expired_cache():
    """Очищає застарілі записи з кешу"""
    expired_keys = [
        user_id for user_id, cached in _profile_cache.items()
        if cached.is_expired()
    ]
    for key in expired_keys:
        _profile_cache.pop(key, None)
