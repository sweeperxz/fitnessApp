from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List

# ── Auth ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: str
    has_profile: bool

# ── Profile ───────────────────────────────────────────────
class ProfileCreate(BaseModel):
    weight: float = Field(default=70, ge=20, le=500)
    goal: str = "maintain"
    activity: str = "medium"
    water_goal: int = Field(default=2500, ge=500, le=10000)
    calories_goal: int = Field(default=2000, ge=500, le=15000)
    protein_goal: int = Field(default=150, ge=0, le=1000)
    fat_goal: int = Field(default=70, ge=0, le=1000)
    carbs_goal: int = Field(default=250, ge=0, le=2000)

class Profile(ProfileCreate):
    id: int
    user_id: int
    class Config: from_attributes = True

# ── Meals ─────────────────────────────────────────────────
class MealCreate(BaseModel):
    day: date
    meal_type: str
    name: str
    calories: float = Field(default=0, ge=0, le=50000)
    protein: float = Field(default=0, ge=0, le=5000)
    fat: float = Field(default=0, ge=0, le=5000)
    carbs: float = Field(default=0, ge=0, le=5000)

class Meal(MealCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config: from_attributes = True

class NutritionDay(BaseModel):
    day: date
    meals: List[Meal]
    total_calories: float
    total_protein: float
    total_fat: float
    total_carbs: float
    water_ml: int

# ── Water ─────────────────────────────────────────────────
class WaterLogCreate(BaseModel):
    day: date
    amount_ml: int = Field(ge=0, le=20000)

class WaterLog(WaterLogCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config: from_attributes = True

# ── Workouts ──────────────────────────────────────────────
class ExerciseCreate(BaseModel):
    name: str
    sets: int = Field(default=3, ge=1, le=100)
    reps: int = Field(default=10, ge=1, le=1000)
    weight_kg: float = Field(default=0, ge=0, le=1000)

class Exercise(ExerciseCreate):
    id: int
    workout_id: int
    class Config: from_attributes = True

class WorkoutCreate(BaseModel):
    day: date
    title: str = "Тренировка"
    notes: str = ""
    exercises: Optional[List[ExerciseCreate]] = None

class Workout(WorkoutCreate):
    id: int
    user_id: int
    created_at: datetime
    exercises: List[Exercise] = []
    class Config: from_attributes = True

# ── Stats ─────────────────────────────────────────────────
class DayStats(BaseModel):
    day: date
    calories: float
    protein: float
    fat: float
    carbs: float
    water_ml: int
    workout_count: int

class Stats(BaseModel):
    days: List[DayStats]
    avg_calories: float
    total_workouts: int
    avg_water: float
    streak: int

class GoogleAuthRequest(BaseModel):
    credential: str  # Google id_token

class ChatMessage(BaseModel):
    role: str # Ожидаем 'user' или 'assistant' из фронтенда
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class FoodItemBase(BaseModel):
    name: str
    brand: Optional[str] = ""
    calories: int
    protein: int
    fat: int
    carbs: int

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemResponse(FoodItemBase):
    id: int

    class Config:
        from_attributes = True