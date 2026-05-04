from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

def utcnow():
    """Повертає поточний час в UTC"""
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=True)  # Nullable для OAuth користувачів
    name          = Column(String, default="")
    role          = Column(String, default="user", nullable=False)
    google_id     = Column(String, unique=True, nullable=True, index=True)  # Окреме поле для Google ID
    created_at    = Column(DateTime, default=utcnow)

    profile  = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete")
    meals    = relationship("Meal",    back_populates="user", cascade="all, delete")
    waters   = relationship("WaterLog", back_populates="user", cascade="all, delete")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete")
    foods    = relationship("UserFood", back_populates="user", cascade="all, delete")

class Profile(Base):
    __tablename__ = "profiles"
    id                = Column(Integer, primary_key=True)
    user_id           = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    weight            = Column(Float, default=70)
    # height/age/gender нужны для пересчёта целей на ProfilePage; раньше
    # хардкодились (175см/30/male) — это вычислялось правильно только
    # для онбординга. Nullable — чтобы старые профили (до миграции 0008)
    # не разваливались до того, как юзер откроет редактор и сохранит.
    height            = Column(Float, nullable=True)
    age               = Column(Integer, nullable=True)
    gender            = Column(String, nullable=True)
    goal              = Column(String, default="")
    activity          = Column(String, default="medium")
    water_goal        = Column(Integer, default=2500)
    calories_goal     = Column(Integer, default=2000)
    protein_goal      = Column(Integer, default=150)
    fat_goal          = Column(Integer, default=70)
    carbs_goal        = Column(Integer, default=250)
    fatsecret_region  = Column(String, default="default")

    user = relationship("User", back_populates="profile")

class Meal(Base):
    __tablename__ = "meals"
    __table_args__ = (
        Index('ix_meals_user_day', 'user_id', 'day'),
    )
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date, nullable=False)
    meal_type  = Column(String, nullable=False)
    name       = Column(String, nullable=False)
    calories   = Column(Float, default=0)
    protein    = Column(Float, default=0)
    fat        = Column(Float, default=0)
    carbs      = Column(Float, default=0)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="meals")

class WaterLog(Base):
    __tablename__ = "water_logs"
    __table_args__ = (
        Index('ix_water_user_day', 'user_id', 'day'),
    )
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date, nullable=False)
    amount_ml  = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="waters")

class Workout(Base):
    __tablename__ = "workouts"
    __table_args__ = (
        Index('ix_workouts_user_day', 'user_id', 'day'),
    )
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date, nullable=False)
    title      = Column(String, default="Тренировка")
    notes      = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)

    user      = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete")

class Exercise(Base):
    __tablename__ = "exercises"
    id         = Column(Integer, primary_key=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    name       = Column(String)
    sets       = Column(Integer, default=3)
    reps       = Column(Integer, default=10)
    weight_kg  = Column(Float, default=0)

    workout = relationship("Workout", back_populates="exercises")


class UserFood(Base):
    __tablename__ = "user_foods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String, index=True)
    brand = Column(String, nullable=True)
    # Раньше было Integer — терялась десятичная часть КБЖУ при сохранении в
    # «недавние»; в Meal эти поля Float, поэтому накопительно у юзеров,
    # которые часто переиспользуют продукт из «недавних», уезжали
    # значения. Миграция 0009 переключает колонки на DOUBLE PRECISION.
    calories = Column(Float)
    protein = Column(Float)
    fat = Column(Float)
    carbs = Column(Float)
    last_used = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="foods")

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    endpoint   = Column(String, unique=True, nullable=False)
    p256dh     = Column(String, nullable=False)
    auth       = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")


class SyncOperation(Base):
    __tablename__ = "sync_operations"
    __table_args__ = (
        Index('ix_sync_user_opid_unique', 'user_id', 'op_id', unique=True),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    op_id = Column(String, nullable=False)
    operation_type = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    resource_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User")