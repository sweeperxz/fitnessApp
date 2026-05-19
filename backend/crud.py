from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import date, timedelta
import models, schemas

SYNC_OP_ADD_MEAL = "nutrition.add_meal"
SYNC_OP_LOG_WATER = "nutrition.log_water"
SYNC_OP_CREATE_WORKOUT = "workouts.create"


def _get_sync_operation(db: Session, user_id: int, op_id: str):
    return db.query(models.SyncOperation).filter(
        models.SyncOperation.user_id == user_id,
        models.SyncOperation.op_id == op_id,
    ).first()


def _get_or_create_idempotent_resource(
    db: Session,
    user_id: int,
    op_id: str,
    expected_operation: str,
    expected_resource_type: str,
):
    existing_op = _get_sync_operation(db, user_id, op_id)
    if not existing_op:
        return None

    if existing_op.operation_type != expected_operation or existing_op.resource_type != expected_resource_type:
        raise ValueError("op_id already used for different operation")

    if expected_resource_type == "meal":
        return db.query(models.Meal).filter(
            models.Meal.id == existing_op.resource_id,
            models.Meal.user_id == user_id,
        ).first()

    if expected_resource_type == "water_log":
        return db.query(models.WaterLog).filter(
            models.WaterLog.id == existing_op.resource_id,
            models.WaterLog.user_id == user_id,
        ).first()

    if expected_resource_type == "workout":
        from sqlalchemy.orm import joinedload
        return (
            db.query(models.Workout)
            .options(joinedload(models.Workout.exercises))
            .filter(
                models.Workout.id == existing_op.resource_id,
                models.Workout.user_id == user_id,
            )
            .first()
        )

    return None


def register_sync_operation(
    db: Session,
    user_id: int,
    op_id: str,
    operation_type: str,
    resource_type: str,
    resource_id: int,
):
    op = models.SyncOperation(
        user_id=user_id,
        op_id=op_id,
        operation_type=operation_type,
        resource_type=resource_type,
        resource_id=resource_id,
    )
    db.add(op)
    try:
        db.commit()
        db.refresh(op)
        return op
    except IntegrityError:
        db.rollback()
        return _get_sync_operation(db, user_id, op_id)


def count_admin_users(db: Session) -> int:
    return db.query(models.User).filter(models.User.role == "admin").count()

# ── Profile ───────────────────────────────────────────────
def get_profile(db: Session, user_id: int):
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()


def upsert_profile(db: Session, user_id: int, data: schemas.ProfileCreate):
    p = db.query(models.Profile).filter(models.Profile.user_id == user_id).first()
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
def get_daily_calories(db: Session, user_id: int, day: date) -> float:
    from sqlalchemy import func
    result = db.query(func.sum(models.Meal.calories)).filter(
        models.Meal.user_id == user_id,
        models.Meal.day == day
    ).scalar()
    return float(result) if result else 0.0

def get_daily_water(db: Session, user_id: int, day: date) -> int:
    from sqlalchemy import func
    result = db.query(func.sum(models.WaterLog.amount_ml)).filter(
        models.WaterLog.user_id == user_id,
        models.WaterLog.day == day
    ).scalar()
    return int(result) if result else 0

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
    meal_data = data.model_dump(exclude={'op_id'})
    meal = models.Meal(user_id=user_id, **meal_data)
    db.add(meal)
    db.flush()

    if data.op_id:
        db.add(models.SyncOperation(
            user_id=user_id,
            op_id=data.op_id,
            operation_type=SYNC_OP_ADD_MEAL,
            resource_type="meal",
            resource_id=meal.id,
        ))

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if data.op_id:
            existing = _get_or_create_idempotent_resource(
                db,
                user_id,
                data.op_id,
                SYNC_OP_ADD_MEAL,
                "meal",
            )
            if existing:
                return existing
        raise exc

    db.refresh(meal)
    return meal

def delete_meal(db: Session, meal_id: int, user_id: int) -> bool:
    """Удалить приём пищи. Возвращает True если что-то удалено, иначе False."""
    meal = db.query(models.Meal).filter(
        models.Meal.id == meal_id,
        models.Meal.user_id == user_id
    ).first()
    if meal:
        db.delete(meal)
        db.commit()
        return True
    return False

def log_water(db: Session, user_id: int, data: schemas.WaterLogCreate):
    water_data = data.model_dump(exclude={'op_id'})
    log = models.WaterLog(user_id=user_id, **water_data)
    db.add(log)
    db.flush()

    if data.op_id:
        db.add(models.SyncOperation(
            user_id=user_id,
            op_id=data.op_id,
            operation_type=SYNC_OP_LOG_WATER,
            resource_type="water_log",
            resource_id=log.id,
        ))

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if data.op_id:
            existing = _get_or_create_idempotent_resource(
                db,
                user_id,
                data.op_id,
                SYNC_OP_LOG_WATER,
                "water_log",
            )
            if existing:
                return existing
        raise exc

    db.refresh(log)
    return log


def get_idempotent_meal(db: Session, user_id: int, op_id: str):
    return _get_or_create_idempotent_resource(
        db,
        user_id,
        op_id,
        SYNC_OP_ADD_MEAL,
        "meal",
    )


def get_idempotent_water_log(db: Session, user_id: int, op_id: str):
    return _get_or_create_idempotent_resource(
        db,
        user_id,
        op_id,
        SYNC_OP_LOG_WATER,
        "water_log",
    )

# ── Workouts ──────────────────────────────────────────────
def get_exercise_library(db: Session, muscle: str | None = None, q: str | None = None, equipment: str | None = None):
    query = db.query(models.ExerciseLibraryItem).filter(models.ExerciseLibraryItem.is_active == True)

    if muscle and muscle != "All":
        query = query.filter(models.ExerciseLibraryItem.muscle == muscle)
    if equipment:
        query = query.filter(models.ExerciseLibraryItem.equipment == equipment)
    if q:
        query = query.filter(models.ExerciseLibraryItem.name.ilike(f"%{q.strip()}%"))

    return query.order_by(models.ExerciseLibraryItem.muscle, models.ExerciseLibraryItem.name).all()


def _exercise_payload(db: Session, data: schemas.ExerciseCreate):
    payload = data.model_dump()
    library_exercise_id = payload.get("library_exercise_id")

    if library_exercise_id:
        item = db.query(models.ExerciseLibraryItem).filter(
            models.ExerciseLibraryItem.id == library_exercise_id,
            models.ExerciseLibraryItem.is_active == True,
        ).first()
        if not item:
            raise ValueError("Exercise library item not found")
        payload["name"] = item.name

    return payload


def get_workouts(db: Session, user_id: int, from_date=None, to_date=None):
    from sqlalchemy.orm import joinedload
    q = db.query(models.Workout).options(joinedload(models.Workout.exercises)).filter(models.Workout.user_id == user_id)
    if from_date: q = q.filter(models.Workout.day >= from_date)
    if to_date:   q = q.filter(models.Workout.day <= to_date)
    return q.order_by(models.Workout.day.desc()).all()

def create_workout(db: Session, user_id: int, data: schemas.WorkoutCreate):
    # Идемпотентность: если оффлайн-replay прислал тот же op_id повторно,
    # отдаём ранее созданную тренировку, а не плодим дубль. Та же схема,
    # что у add_meal/log_water — см. _get_or_create_idempotent_resource.
    if data.op_id:
        existing = _get_or_create_idempotent_resource(
            db, user_id, data.op_id, SYNC_OP_CREATE_WORKOUT, "workout"
        )
        if existing:
            return existing

    exercises_data = data.exercises
    workout_dict = data.model_dump(exclude={'exercises', 'op_id'})
    w = models.Workout(user_id=user_id, **workout_dict)
    db.add(w)
    db.flush()  # get w.id without committing yet
    if exercises_data:
        for ex_data in exercises_data:
            payload = _exercise_payload(db, ex_data)
            sets_data = payload.pop("sets", [])
            ex = models.Exercise(workout_id=w.id, **payload)
            db.add(ex)
            db.flush()
            for s in sets_data:
                db_set = models.ExerciseSet(exercise_id=ex.id, **s)
                db.add(db_set)

    if data.op_id:
        db.add(models.SyncOperation(
            user_id=user_id,
            op_id=data.op_id,
            operation_type=SYNC_OP_CREATE_WORKOUT,
            resource_type="workout",
            resource_id=w.id,
        ))

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if data.op_id:
            existing = _get_or_create_idempotent_resource(
                db, user_id, data.op_id, SYNC_OP_CREATE_WORKOUT, "workout"
            )
            if existing:
                return existing
        raise exc
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
    exercise_payload = _exercise_payload(db, data)
    sets_data = exercise_payload.pop("sets", [])

    ex = models.Exercise(workout_id=workout_id, **exercise_payload)
    db.add(ex)
    db.flush()
    for s in sets_data:
        db_set = models.ExerciseSet(exercise_id=ex.id, **s)
        db.add(db_set)
    db.commit()
    db.refresh(ex)
    return ex

def delete_workout(db: Session, workout_id: int, user_id: int) -> bool:
    """Удалить тренировку. Возвращает True если что-то удалено, иначе False."""
    w = db.query(models.Workout).filter(
        models.Workout.id == workout_id,
        models.Workout.user_id == user_id
    ).first()
    if w:
        db.delete(w)
        db.commit()
        return True
    return False

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

    # Build daily stats (oldest -> today) for the response.
    day_stats = []
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

    # Текущий streak — считаем СПРАВА НАЛЕВО (от сегодня к самому старому
    # дню окна), останавливаемся на первом «пустом» (cal==0). Сегодня
    # допустимо иметь 0 (юзер ещё ничего не залогал, но streak в процессе),
    # — оно не обнуляет серию, но и не считается +1.
    #
    # Прежняя реализация шла слева направо и при первом же 0-дне (что
    # норма для большинства окон в 30 дней) обнуляла `streak_active`,
    # из-за чего streak был 0 у всех, кроме идеальных юзеров.
    streak = 0
    for offset in range(0, days):
        d = today - timedelta(days=offset)
        m = meal_map.get(d)
        cal = float(m.cal or 0) if m else 0.0
        if cal > 0:
            streak += 1
        elif offset == 0:
            # Сегодня без записей — серия не сломана, но и +1 не даём.
            continue
        else:
            break

    active = [d for d in day_stats if d.calories > 0]
    return schemas.Stats(
        days=day_stats,
        avg_calories=sum(d.calories for d in active) / len(active) if active else 0,
        total_workouts=sum(d.workout_count for d in day_stats),
        avg_water=sum(d.water_ml for d in active) / len(active) if active else 0,
        streak=streak,
    )

# ── Push Notifications ────────────────────────────────────
def subscribe_push(db: Session, user_id: int, data: schemas.PushSubscriptionCreate):
    # Check if this endpoint already exists for any user
    sub = db.query(models.PushSubscription).filter(models.PushSubscription.endpoint == data.endpoint).first()
    if sub:
        # If exists, update user_id and keys (maybe same user, maybe different)
        sub.user_id = user_id
        sub.p256dh  = data.p256dh
        sub.auth    = data.auth
    else:
        sub = models.PushSubscription(user_id=user_id, **data.model_dump())
        db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

def get_push_subscriptions(db: Session, user_id: int):
    return db.query(models.PushSubscription).filter(models.PushSubscription.user_id == user_id).all()


def delete_push_subscription(db: Session, user_id: int, endpoint: str) -> bool:
    """
    Удалить подписку конкретного юзера по endpoint. Возвращает True, если
    запись была удалена.

    Дополнительно к ленивой чистке "мёртвых" эндпоинтов в send_push_*
    (404/410), этот хук вызывается фронтом при явном отказе от уведомлений
    (`unsubscribeUser`) — иначе строка в БД продолжала висеть до первой
    попытки отправки и съедала cycle при батч-рассылке.
    """
    sub = (
        db.query(models.PushSubscription)
        .filter(
            models.PushSubscription.user_id == user_id,
            models.PushSubscription.endpoint == endpoint,
        )
        .first()
    )
    if not sub:
        return False
    db.delete(sub)
    db.commit()
    return True

def check_goal_reached(db: Session, user_id: int, day: date, goal_type: str) -> tuple[bool, float, float]:
    """
    Перевіряє чи досягнута ціль. Повертає (was_reached_before, value_before, value_after).
    goal_type: 'calories' або 'water'
    """
    from sqlalchemy import func as sqfunc

    profile = get_profile(db, user_id)
    if not profile:
        return False, 0, 0

    if goal_type == 'calories':
        goal = profile.calories_goal
        if not goal:
            return False, 0, 0

        # Отримуємо поточну суму калорій
        result = db.query(sqfunc.sum(models.Meal.calories)).filter(
            models.Meal.user_id == user_id,
            models.Meal.day == day
        ).scalar()

        total = float(result) if result else 0.0
        was_reached = total >= goal
        return was_reached, total, total

    elif goal_type == 'water':
        goal = profile.water_goal
        if not goal:
            return False, 0, 0

        # Отримуємо поточну суму води
        result = db.query(sqfunc.sum(models.WaterLog.amount_ml)).filter(
            models.WaterLog.user_id == user_id,
            models.WaterLog.day == day
        ).scalar()

        total = int(result) if result else 0
        was_reached = total >= goal
        return was_reached, total, total

    return False, 0, 0

# ── Admin ──────────────────────────────────────────────────
def update_user_role(db: Session, user_id: int, role: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.role = role
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False
