"""
Регрессии на crud.get_stats — особенно на расчёт `streak`.

Старая реализация шла от самого старого дня окна к сегодня и обнуляла
streak_active на первой же дырке (а 0-калорийный день в окне 30 дней —
это норма). Получалось streak=0 у всех, кроме тех, кто логит еду каждый
день из последних 30. Теперь считаем «текущую серию ОТ сегодня НАЗАД» с
послаблением на сегодня (юзер ещё может ничего не залогать).
"""

from datetime import date, timedelta

import crud
import models


def _meal(user_id: int, day: date, calories: float = 350.0) -> models.Meal:
    return models.Meal(
        user_id=user_id,
        day=day,
        meal_type="Breakfast",
        name="test",
        calories=calories,
    )


def test_streak_zero_when_no_meals(db_session, make_user):
    user = make_user(email="streak-empty@example.com")
    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 0


def test_streak_one_for_today_only(db_session, make_user):
    user = make_user(email="streak-today@example.com")
    db_session.add(_meal(user.id, date.today()))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 1


def test_streak_consecutive_days_back_from_today(db_session, make_user):
    user = make_user(email="streak-5days@example.com")
    today = date.today()
    for offset in range(5):
        db_session.add(_meal(user.id, today - timedelta(days=offset)))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    # 5 последовательных дней с едой, заканчивающихся сегодня → streak=5.
    assert stats.streak == 5


def test_streak_breaks_on_gap(db_session, make_user):
    """Прерывистая серия: сегодня, вчера, [пропуск], позавчера+1 — streak=2."""
    user = make_user(email="streak-gap@example.com")
    today = date.today()
    db_session.add(_meal(user.id, today))                           # offset 0
    db_session.add(_meal(user.id, today - timedelta(days=1)))       # offset 1
    # offset 2 пропущен
    db_session.add(_meal(user.id, today - timedelta(days=3)))       # offset 3
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 2


def test_streak_today_empty_does_not_reset_running_streak(db_session, make_user):
    """
    Сегодня юзер ещё ничего не залогал, но вчера и позавчера логал —
    серия в процессе (НЕ обнуляется). По текущей логике сегодня без
    данных не даёт +1, но и не ломает прошлые дни.
    """
    user = make_user(email="streak-in-progress@example.com")
    today = date.today()
    db_session.add(_meal(user.id, today - timedelta(days=1)))
    db_session.add(_meal(user.id, today - timedelta(days=2)))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 2


def test_streak_handles_old_data_without_recent(db_session, make_user):
    """
    Старая реализация именно тут ломалась: если есть запись 20 дней
    назад, но за последнюю неделю юзер не логал — раньше streak считался
    «начиная с 20-го дня», но останавливался на разрыве и оставался
    маленьким; на самом же деле у юзера сейчас НЕТ серии вообще.
    """
    user = make_user(email="streak-old-only@example.com")
    today = date.today()
    db_session.add(_meal(user.id, today - timedelta(days=15)))
    db_session.add(_meal(user.id, today - timedelta(days=14)))
    db_session.add(_meal(user.id, today - timedelta(days=13)))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 0


def test_streak_does_not_count_zero_calorie_meal(db_session, make_user):
    """
    Запись с calories=0 не считается «активным днём» — иначе фейковый
    insert ломал бы метрику.
    """
    user = make_user(email="streak-zero-cal@example.com")
    db_session.add(_meal(user.id, date.today(), calories=0.0))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 0


def test_streak_can_reach_window_size(db_session, make_user):
    """Если юзер логал каждый день — streak == days."""
    user = make_user(email="streak-full@example.com")
    today = date.today()
    for offset in range(30):
        db_session.add(_meal(user.id, today - timedelta(days=offset)))
    db_session.commit()

    stats = crud.get_stats(db_session, user.id, days=30)
    assert stats.streak == 30
