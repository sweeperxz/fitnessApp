from sqlalchemy.orm import Session
from datetime import date, timedelta
import models, schemas

# ── Profile ───────────────────────────────────────────────
def get_profile(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()

def upsert_profile(db: Session, user_id: int, data: schemas.ProfileCreate):
    p = get_profile(db, user_id)
    if p:
        for k, v in data.model_dump().items():
            setattr(p, k, v)
    else:
        p = models.Profile(user_id=user_id, **data.model_dump())
        db.add(p)
    db.commit()
    db.refresh(p)
    return p

# ── Nutrition ─────────────────────────────────────────────
def get_nutrition_day(db: Session, user_id: int, day: date) -> schemas.NutritionDay:
    meals = db.query(models.Meal).filter(
        models.Meal.user_id == user_id,
        models.Meal.day == day
    ).order_by(models.Meal.created_at).all()

    water = db.query(models.WaterLog).filter(
        models.WaterLog.user_id == user_id,
        models.WaterLog.day == day
    ).all()

    return schemas.NutritionDay(
        day=day, meals=meals,
        total_calories=sum(m.calories for m in meals),
        total_protein=sum(m.protein for m in meals),
        total_fat=sum(m.fat for m in meals),
        total_carbs=sum(m.carbs for m in meals),
        water_ml=sum(w.amount_ml for w in water),
    )

def add_meal(db: Session, user_id: int, data: schemas.MealCreate):
    meal = models.Meal(user_id=user_id, **data.model_dump())
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal

def delete_meal(db: Session, meal_id: int, user_id: int):
    meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == user_id
    ).first()
    if meal:
        db.delete(meal)
        db.commit()

def log_water(db: Session, user_id: int, data: schemas.WaterLogCreate):
    log = models.WaterLog(user_id=user_id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# ── Workouts ──────────────────────────────────────────────
def get_workouts(db: Session, user_id: int, from_date=None, to_date=None):
    q = db.query(models.Workout).filter(models.Workout.user_id == user_id)
    if from_date: q = q.filter(models.Workout.day >= from_date)
    if to_date:   q = q.filter(models.Workout.day <= to_date)
    return q.order_by(models.Workout.day.desc()).all()

def create_workout(db: Session, user_id: int, data: schemas.WorkoutCreate):
    w = models.Workout(user_id=user_id, **data.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w

def add_exercise(db: Session, workout_id: int, user_id: int, data: schemas.ExerciseCreate):
    # Verify ownership
    w = db.query(models.Workout).filter(
        models.Workout.id == workout_id,
        models.Workout.user_id == user_id
    ).first()
    if not w:
        return None
    ex = models.Exercise(workout_id=workout_id, **data.model_dump())
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex

def delete_workout(db: Session, workout_id: int, user_id: int):
    w = db.query(models.Workout).filter(
        models.Workout.id == workout_id,
        models.Workout.user_id == user_id
    ).first()
    if w:
        db.delete(w)
        db.commit()

# ── Stats ─────────────────────────────────────────────────
def get_stats(db: Session, user_id: int, days: int = 30) -> schemas.Stats:
    today = date.today()
    day_stats = []
    streak = 0
    streak_active = True

    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        meals = db.query(models.Meal).filter(
            models.Meal.user_id == user_id, models.Meal.day == d).all()
        water = db.query(models.WaterLog).filter(
            models.WaterLog.user_id == user_id, models.WaterLog.day == d).all()
        workouts = db.query(models.Workout).filter(
            models.Workout.user_id == user_id, models.Workout.day == d).count()

        cal = sum(m.calories for m in meals)
        day_stats.append(schemas.DayStats(
            day=d, calories=cal,
            protein=sum(m.protein for m in meals),
            fat=sum(m.fat for m in meals),
            carbs=sum(m.carbs for m in meals),
            water_ml=sum(w.amount_ml for w in water),
            workout_count=workouts,
        ))

        if streak_active and i <= days - 1:
            if cal > 0:
                streak += 1
            elif i != 0:
                streak_active = False

    active = [d for d in day_stats if d.calories > 0]
    return schemas.Stats(
        days=day_stats,
        avg_calories=sum(d.calories for d in active) / len(active) if active else 0,
        total_workouts=sum(d.workout_count for d in day_stats),
        avg_water=sum(d.water_ml for d in active) / len(active) if active else 0,
        streak=streak,
    )
