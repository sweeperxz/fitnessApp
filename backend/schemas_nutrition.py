"""
Схемы для расчета целей по питанию
"""
from pydantic import BaseModel, Field, validator
from typing import Literal


class CalculateGoalsRequest(BaseModel):
    """Запрос на расчет целей КБЖУ"""
    weight: float = Field(..., gt=0, description="Вес в кг (должен быть положительным)")
    height: float = Field(default=175, gt=0, le=250, description="Рост в см")
    age: int = Field(default=30, gt=0, le=120, description="Возраст в годах")
    gender: Literal['male', 'female'] = Field(default='male', description="Пол")
    goal: Literal['lose', 'maintain', 'gain'] = Field(..., description="Цель: похудение, поддержание или набор массы")
    activity: Literal['low', 'medium', 'high'] = Field(..., description="Уровень активности")

    @validator('weight')
    def validate_weight(cls, v):
        if v < 30 or v > 300:
            raise ValueError('Вес должен быть в диапазоне 30-300 кг')
        return v


class CalculateGoalsResponse(BaseModel):
    """Ответ с рассчитанными целями"""
    calories_goal: int = Field(..., description="Целевые калории в день")
    protein_goal: int = Field(..., description="Целевой белок в граммах")
    fat_goal: int = Field(..., description="Целевые жиры в граммах")
    carbs_goal: int = Field(..., description="Целевые углеводы в граммах")
    water_goal: int = Field(..., description="Целевая вода в мл")
    bmr: int = Field(..., description="Базовый метаболизм (BMR)")
    tdee: int = Field(..., description="Общий расход энергии (TDEE)")
