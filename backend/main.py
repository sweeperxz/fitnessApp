"""
Точка входа Nutrio API. Здесь только bootstrap: FastAPI(), middleware,
slowapi limiter и подключение доменных роутеров.
Сами хендлеры лежат в `routers/*` и вызывают `services/*` + `crud.py`.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings
from rate_limit import limiter
from routers import (
    admin,
    ai,
    auth as auth_router,
    foods,
    health,
    nutrition,
    profile,
    push,
    stats,
    workouts,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("Nutrio API starting up...")
logger.info(f"CORS origins: {settings.cors_origins_list}")

app = FastAPI(title="Nutrio API", version="2.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(auth_router.router)
app.include_router(admin.router)
app.include_router(profile.router)
app.include_router(nutrition.router)
app.include_router(workouts.router)
app.include_router(stats.router)
app.include_router(ai.router)
app.include_router(foods.router)
app.include_router(push.router)
