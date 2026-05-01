"""
Тестовые фикстуры: in-memory SQLite + переопределение `get_db` + FastAPI TestClient.

Зачем SQLite: поднимать Postgres в CI — лишний шаг, а мы тестируем ORM-логику и
HTTP-контракты, а не специфичные для Postgres фичи. Уникальные индексы и
ON DELETE CASCADE в SQLite работают, чего нам достаточно. UNIQUE-индекс на
`(user_id, op_id)` (sync_operations) тоже соблюдается — это покрывает
тесты идемпотентности.
"""

from __future__ import annotations

import os

# Дамми-окружение должно быть выставлено ДО импорта `config` /
# любых модулей бэка, иначе pydantic-settings упадёт на отсутствующих полях.
# `database.py` создаёт глобальный engine при импорте с `pool_size`/`max_overflow`
# — эти аргументы валидны только для Postgres-драйвера, поэтому даём SQLAlchemy
# фейковый Postgres-URL: connection до него никогда не открывается, потому что
# в тестах мы переопределяем `get_db` через `app.dependency_overrides`.
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_unused")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("VAPID_EMAIL", "mailto:test@example.com")
os.environ.setdefault("VAPID_PRIVATE_KEY", "test-vapid-private")
os.environ.setdefault("VAPID_PUBLIC_KEY", "test-vapid-public")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("FATSECRET_CLIENT_ID", "test-fs-id")
os.environ.setdefault("FATSECRET_CLIENT_SECRET", "test-fs-secret")
os.environ.setdefault("FATSECRET_SCOPE", "basic")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import auth as auth_module
import models
from database import Base
from main import app


# Один in-memory движок на всю сессию — но БД пересоздаём перед каждым тестом,
# чтобы они были изолированы. StaticPool нужен, чтобы все коннекты ходили в
# тот же in-memory файл (иначе каждое подключение получает свою пустую БД).
@pytest.fixture(scope="session")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    return eng


@pytest.fixture()
def db_session(engine):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_session):
    """TestClient с переопределённым `get_db`, отдающим SQLite-сессию."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # сессию закрывает фикстура db_session

    app.dependency_overrides[auth_module.get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(auth_module.get_db, None)


def _create_user(db_session, *, email: str, role: str = "user", password: str | None = "Passw0rd!") -> models.User:
    user = models.User(
        email=email,
        password_hash=auth_module.hash_password(password) if password else None,
        name=email.split("@")[0],
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def make_user(db_session):
    """Фабрика юзеров: `make_user(email=..., role=...)`."""

    def _factory(*, email: str = "user@example.com", role: str = "user", password: str | None = "Passw0rd!"):
        return _create_user(db_session, email=email, role=role, password=password)

    return _factory


@pytest.fixture()
def auth_headers():
    """Возвращает фабрику Bearer-заголовков для произвольного user_id."""

    def _factory(user_id: int) -> dict[str, str]:
        token = auth_module.create_token(user_id)
        return {"Authorization": f"Bearer {token}"}

    return _factory
