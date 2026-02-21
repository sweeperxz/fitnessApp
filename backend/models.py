from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name          = Column(String, default="")
    created_at    = Column(DateTime, default=func.now())

    profile  = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete")
    meals    = relationship("Meal",    back_populates="user", cascade="all, delete")
    waters   = relationship("WaterLog", back_populates="user", cascade="all, delete")
    workouts = relationship("Workout", back_populates="user", cascade="all, delete")

class Profile(Base):
    __tablename__ = "profiles"
    id            = Column(Integer, primary_key=True)
    user_id       = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    weight        = Column(Float, default=70)
    goal          = Column(String, default="")
    activity      = Column(String, default="medium")
    water_goal    = Column(Integer, default=2500)
    calories_goal = Column(Integer, default=2000)
    protein_goal  = Column(Integer, default=150)
    fat_goal      = Column(Integer, default=70)
    carbs_goal    = Column(Integer, default=250)

    user = relationship("User", back_populates="profile")

class Meal(Base):
    __tablename__ = "meals"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date)
    meal_type  = Column(String)
    name       = Column(String)
    calories   = Column(Float, default=0)
    protein    = Column(Float, default=0)
    fat        = Column(Float, default=0)
    carbs      = Column(Float, default=0)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="meals")

class WaterLog(Base):
    __tablename__ = "water_logs"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date)
    amount_ml  = Column(Integer)
    created_at = Column(DateTime, default=func.now())

    user = relationship("User", back_populates="waters")

class Workout(Base):
    __tablename__ = "workouts"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), index=True)
    day        = Column(Date)
    title      = Column(String, default="Тренировка")
    notes      = Column(String, default="")
    created_at = Column(DateTime, default=func.now())

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
