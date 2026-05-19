from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List

# ── Auth ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: EmailStr
    role: str = "user"
    has_profile: bool

class UserAdminResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    created_at: datetime
    class Config: from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(user|admin)$")

# ── Profile ───────────────────────────────────────────────
class ProfileCreate(BaseModel):
    weight: float = Field(..., gt=0, le=500, description="Вес в кг")
    # height/age/gender — необязательные, чтобы не сломать существующих юзеров
    # без миграции данных. После открытия редактора они будут заполняться.
    height: Optional[float] = Field(default=None, gt=0, le=300, description="Рост в см")
    age: Optional[int] = Field(default=None, gt=0, le=120, description="Возраст в годах")
    gender: Optional[str] = Field(default=None, pattern="^(male|female)$", description="Пол")
    goal: str = Field(..., pattern="^(lose|maintain|gain)$", description="Цель: lose, maintain, gain")
    activity: str = Field(..., pattern="^(low|medium|high)$", description="Активность: low, medium, high")
    water_goal: int = Field(..., ge=0, le=20000, description="Цель по воде в мл")
    calories_goal: int = Field(..., ge=0, le=10000, description="Цель по калориям")
    protein_goal: int = Field(..., ge=0, le=500, description="Цель по белкам в г")
    fat_goal: int = Field(..., ge=0, le=500, description="Цель по жирам в г")
    carbs_goal: int = Field(..., ge=0, le=1000, description="Цель по углеводам в г")
    fatsecret_region: str = Field(default="default", pattern="^(default|us|ua|uk|fr|de|it|es|ca|au|nz|ie|in|sg|za)$")

class Profile(ProfileCreate):
    id: int
    user_id: int
    class Config: from_attributes = True

# ── Meals ─────────────────────────────────────────────────
class MealCreate(BaseModel):
    day: date
    meal_type: str
    name: str
    op_id: Optional[str] = None
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
    op_id: Optional[str] = None

class WaterLog(WaterLogCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config: from_attributes = True

# ── Workouts ──────────────────────────────────────────────
class ExerciseLibraryItem(BaseModel):
    id: int
    name: str
    muscle: str
    equipment: str = ""
    description: str = ""
    is_active: bool
    class Config: from_attributes = True

class ExerciseCreate(BaseModel):
    name: str
    library_exercise_id: Optional[int] = None
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
    barcode: Optional[str] = None

class FoodItemCreate(FoodItemBase):
    pass

class FoodItemResponse(FoodItemBase):
    id: int

    class Config:
        from_attributes = True

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str

class PushSubscriptionDelete(BaseModel):
    endpoint: str

class PushSubscriptionResponse(PushSubscriptionCreate):
    id: int
    user_id: int
    created_at: datetime
    class Config: from_attributes = True