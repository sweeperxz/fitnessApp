"""
Сервис для расчета нутриционных целей
Вся бизнес-логика расчетов находится здесь, а не на фронтенде
"""
from typing import Literal


def calculate_bmr(weight: float, height: float, age: int, gender: Literal['male', 'female']) -> float:
    """
    Расчет базового метаболизма (BMR) по формуле Миффлина-Сан Жеора

    Формула:
    - Мужчины: BMR = 10 * вес(кг) + 6.25 * рост(см) - 5 * возраст(лет) + 5
    - Женщины: BMR = 10 * вес(кг) + 6.25 * рост(см) - 5 * возраст(лет) - 161
    """
    bmr = 10 * weight + 6.25 * height - 5 * age

    if gender == 'male':
        bmr += 5
    else:
        bmr -= 161

    return bmr


def calculate_tdee(bmr: float, activity: Literal['low', 'medium', 'high']) -> float:
    """
    Расчет общего дневного расхода энергии (TDEE)

    Коэффициенты активности:
    - low: 1.2 (минимальная активность)
    - medium: 1.55 (умеренная активность 3-5 дней/неделю)
    - high: 1.725 (высокая активность 6-7 дней/неделю)
    """
    activity_multipliers = {
        'low': 1.2,
        'medium': 1.55,
        'high': 1.725
    }

    return bmr * activity_multipliers[activity]


def adjust_calories_for_goal(tdee: float, goal: Literal['lose', 'maintain', 'gain']) -> float:
    """
    Корректировка калорий в зависимости от цели

    - lose: -400 ккал (дефицит для похудения)
    - maintain: без изменений
    - gain: +300 ккал (профицит для набора массы)
    """
    if goal == 'lose':
        return tdee - 400
    elif goal == 'gain':
        return tdee + 300
    else:  # maintain
        return tdee


def calculate_macros(calories: float, weight: float) -> dict:
    """
    Расчет макронутриентов (белки, жиры, углеводы)

    Правила:
    - Белки: 2г на кг веса (4 ккал/г)
    - Жиры: 1г на кг веса (9 ккал/г)
    - Углеводы: остаток калорий (4 ккал/г), минимум 50г
    """
    protein_g = round(weight * 2)
    fat_g = round(weight)

    # Рассчитываем углеводы из оставшихся калорий
    protein_calories = protein_g * 4
    fat_calories = fat_g * 9
    remaining_calories = calories - protein_calories - fat_calories
    carbs_g = max(round(remaining_calories / 4), 50)

    return {
        'protein_goal': protein_g,
        'fat_goal': fat_g,
        'carbs_goal': carbs_g
    }


def calculate_water_goal(weight: float) -> int:
    """
    Расчет целевого потребления воды

    Формула: 30 мл на кг веса
    """
    return round(weight * 30)


def calculate_nutrition_goals(
    weight: float,
    height: float,
    age: int,
    gender: Literal['male', 'female'],
    goal: Literal['lose', 'maintain', 'gain'],
    activity: Literal['low', 'medium', 'high']
) -> dict:
    """
    Полный расчет всех нутриционных целей

    Возвращает словарь с:
    - calories_goal: целевые калории
    - protein_goal: целевой белок (г)
    - fat_goal: целевые жиры (г)
    - carbs_goal: целевые углеводы (г)
    - water_goal: целевая вода (мл)
    - bmr: базовый метаболизм
    - tdee: общий расход энергии
    """
    # Шаг 1: Расчет BMR
    bmr = calculate_bmr(weight, height, age, gender)

    # Шаг 2: Расчет TDEE
    tdee = calculate_tdee(bmr, activity)

    # Шаг 3: Корректировка под цель
    calories = adjust_calories_for_goal(tdee, goal)

    # Шаг 4: Расчет макронутриентов
    macros = calculate_macros(calories, weight)

    # Шаг 5: Расчет воды
    water = calculate_water_goal(weight)

    return {
        'calories_goal': round(calories),
        'protein_goal': macros['protein_goal'],
        'fat_goal': macros['fat_goal'],
        'carbs_goal': macros['carbs_goal'],
        'water_goal': water,
        'bmr': round(bmr),
        'tdee': round(tdee)
    }
