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
    # Clamp days to sane range to prevent abuse
    days = max(1, min(days, 365))
    today = date.today()
    start = today - timedelta(days=days - 1)

    # 1 query: aggregate meals by day
    from sqlalchemy import func as sqfunc
    meal_rows = db.query(
        models.Meal.day,
        sqfunc.sum(models.Meal.calories).label("cal"),
        sqfunc.sum(models.Meal.protein).label("pro"),
        sqfunc.sum(models.Meal.fat).label("fat"),
        sqfunc.sum(models.Meal.carbs).label("carb"),
    ).filter(
        models.Meal.user_id == user_id,
        models.Meal.day >= start,
        models.Meal.day <= today,
    ).group_by(models.Meal.day).all()

    meal_map = {r.day: r for r in meal_rows}

    # 1 query: aggregate water by day
    water_rows = db.query(
        models.WaterLog.day,
        sqfunc.sum(models.WaterLog.amount_ml).label("ml"),
    ).filter(
        models.WaterLog.user_id == user_id,
        models.WaterLog.day >= start,
        models.WaterLog.day <= today,
    ).group_by(models.WaterLog.day).all()

    water_map = {r.day: r.ml or 0 for r in water_rows}

    # 1 query: count workouts by day
    workout_rows = db.query(
        models.Workout.day,
        sqfunc.count(models.Workout.id).label("cnt"),
    ).filter(
        models.Workout.user_id == user_id,
        models.Workout.day >= start,
        models.Workout.day <= today,
    ).group_by(models.Workout.day).all()

    workout_map = {r.day: r.cnt for r in workout_rows}

    # Build daily stats from the 3 result maps
    day_stats = []
    streak = 0
    streak_active = True

    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        m = meal_map.get(d)
        cal = float(m.cal or 0) if m else 0.0

        day_stats.append(schemas.DayStats(
            day=d,
            calories=cal,
            protein=float(m.pro or 0) if m else 0.0,
            fat=float(m.fat or 0) if m else 0.0,
            carbs=float(m.carb or 0) if m else 0.0,
            water_ml=water_map.get(d, 0),
            workout_count=workout_map.get(d, 0),
        ))

        if streak_active:
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
