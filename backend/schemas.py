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

class UserAdminListResponse(BaseModel):
    # Раньше /admin/users отдавал просто list[UserAdminResponse]; фронт
    # не знал общего количества и обрезал список после первой страницы
    # (limit=50). Теперь отдаём `items` + `total`, чтобы пагинировать.
    items: list[UserAdminResponse]
    total: int
    skip: int
    limit: int

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
    # Допустимые значения совпадают с фронтовым `utils/constants.MEAL_TYPES`
    # (`Breakfast`/`Lunch`/`Dinner`/`Snack`). До этой валидации бэк
    # принимал любую строку, включая опечатки и случайный мусор из
    # оффлайн-replay'а — данные потом не группировались на UI.
    meal_type: str = Field(..., pattern="^(Breakfast|Lunch|Dinner|Snack)$")
    name: str = Field(..., min_length=1, max_length=200)
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
    title: str = Field(default="Тренировка", min_length=1, max_length=200)
    notes: str = Field(default="", max_length=2000)
    exercises: Optional[List[ExerciseCreate]] = None
    # op_id используется для дедупликации при оффлайн-replay'е (см.
    # crud.create_workout). До этого PR'а workout мог попасть в БД дважды,
    # если очередь оффлайн-записи переотправляла тот же запрос после того,
    # как сервер уже принял первый.
    op_id: Optional[str] = None

class Workout(BaseModel):
    # Раньше Workout наследовал WorkoutCreate. С добавлением op_id в Create
    # это утянуло бы op_id в ответ — а это поле служебное, не для UI.
    # Поэтому Workout явно перечисляет свои поля.
    id: int
    user_id: int
    day: date
    title: str
    notes: str = ""
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
    # Только 'user' и 'assistant' — `system` нельзя присылать с фронта,
    # системный промпт мы формируем на бэке (см. routers/ai.py).
    role: str = Field(..., pattern="^(user|assistant)$")
    # Лимит длины каждого сообщения. Без него любой авторизованный юзер
    # мог скормить Gemini десятки тысяч токенов в одном «сообщении» —
    # прямой риск по биллингу.
    content: str = Field(..., min_length=1, max_length=4000)

class ChatRequest(BaseModel):
    # max_length=50 — типовой контекст AI-ассистента; больше в один запрос
    # отправлять не имеет смысла, дешевле обрезать историю на клиенте.
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=50)


class FoodItemBase(BaseModel):
    name: str
    brand: Optional[str] = ""
    # Float (не Int) — иначе в /foods/recent теряются десятые грамма КБЖУ.
    # Meal использует Float; чтобы «недавние» не порезали 23.3 → 23 при
    # каждом повторном использовании, держим тот же тип.
    calories: float = Field(default=0, ge=0, le=50000)
    protein: float = Field(default=0, ge=0, le=5000)
    fat: float = Field(default=0, ge=0, le=5000)
    carbs: float = Field(default=0, ge=0, le=5000)

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