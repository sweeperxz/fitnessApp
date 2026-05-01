"""
Чистые юнит-тесты `services/nutrition_calculator.py`. БД и FastAPI не нужны.
Проверяем формулы и граничные случаи (минимум углеводов, корректировка под цель).
"""

import pytest

from services.nutrition_calculator import (
    adjust_calories_for_goal,
    calculate_bmr,
    calculate_macros,
    calculate_nutrition_goals,
    calculate_tdee,
    calculate_water_goal,
)


class TestCalculateBmr:
    def test_male_mifflin_st_jeor(self):
        # 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
        assert calculate_bmr(70, 175, 30, "male") == pytest.approx(1648.75)

    def test_female_mifflin_st_jeor(self):
        # 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
        assert calculate_bmr(60, 165, 25, "female") == pytest.approx(1345.25)


class TestCalculateTdee:
    def test_low_activity(self):
        assert calculate_tdee(1500, "low") == pytest.approx(1800.0)

    def test_medium_activity(self):
        assert calculate_tdee(1500, "medium") == pytest.approx(2325.0)

    def test_high_activity(self):
        assert calculate_tdee(1500, "high") == pytest.approx(2587.5)


class TestAdjustCaloriesForGoal:
    def test_lose_subtracts_400(self):
        assert adjust_calories_for_goal(2500, "lose") == 2100

    def test_gain_adds_300(self):
        assert adjust_calories_for_goal(2500, "gain") == 2800

    def test_maintain_unchanged(self):
        assert adjust_calories_for_goal(2500, "maintain") == 2500


class TestCalculateMacros:
    def test_typical_male(self):
        macros = calculate_macros(2500, 70)
        assert macros["protein_goal"] == 140  # 70 * 2
        assert macros["fat_goal"] == 70  # 70 * 1
        # remaining = 2500 - 140*4 - 70*9 = 2500 - 560 - 630 = 1310 / 4 = 327.5
        assert macros["carbs_goal"] == 328

    def test_low_calories_floor_carbs_at_50(self):
        # Подбираем кейс, где из формулы выйдет <50 г углеводов.
        # weight=80 → protein=160 (640 кал), fat=80 (720 кал), всего 1360 кал
        # на белки+жиры. При calories=1500 на углеводы остаётся 140 кал = 35 г → floor до 50.
        macros = calculate_macros(1500, 80)
        assert macros["carbs_goal"] == 50


class TestCalculateWaterGoal:
    def test_30ml_per_kg(self):
        assert calculate_water_goal(70) == 2100
        assert calculate_water_goal(85.5) == 2565


class TestCalculateNutritionGoals:
    def test_full_pipeline_male_maintain_medium(self):
        goals = calculate_nutrition_goals(
            weight=70, height=175, age=30, gender="male",
            goal="maintain", activity="medium",
        )
        # bmr=1648.75; tdee=2555.5625; calories=2555.5625
        assert goals["bmr"] == 1649  # round
        assert goals["tdee"] == 2556
        assert goals["calories_goal"] == 2556
        assert goals["water_goal"] == 2100
        assert goals["protein_goal"] == 140
        assert goals["fat_goal"] == 70

    def test_lose_reduces_calories_by_400(self):
        a = calculate_nutrition_goals(70, 175, 30, "male", "maintain", "medium")
        b = calculate_nutrition_goals(70, 175, 30, "male", "lose", "medium")
        assert a["calories_goal"] - b["calories_goal"] == 400
