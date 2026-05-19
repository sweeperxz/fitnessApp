import models
from datetime import date

def test_create_and_get_workout_with_sets(client, make_user, auth_headers, db_session):
    user = make_user(email="workout-tester@example.com")
    headers = auth_headers(user.id)

    # 1. Create a workout with exercises and multiple sets
    workout_data = {
        "day": str(date.today()),
        "title": "Утренняя тренировка",
        "notes": "Почувствовал прилив сил",
        "exercises": [
            {
                "name": "Приседания со штангой",
                "sets": [
                    {"weight_kg": 60.0, "reps": 10},
                    {"weight_kg": 70.0, "reps": 8},
                    {"weight_kg": 80.0, "reps": 6}
                ]
            },
            {
                "name": "Жим лежа",
                "sets": [
                    {"weight_kg": 50.0, "reps": 12},
                    {"weight_kg": 55.0, "reps": 10}
                ]
            }
        ]
    }

    resp = client.post("/workouts", json=workout_data, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Утренняя тренировка"
    assert len(data["exercises"]) == 2
    
    # Verify sets on squats
    squats = [ex for ex in data["exercises"] if ex["name"] == "Приседания со штангой"][0]
    assert len(squats["sets"]) == 3
    assert squats["sets"][0]["weight_kg"] == 60.0
    assert squats["sets"][0]["reps"] == 10
    assert squats["sets"][2]["weight_kg"] == 80.0
    assert squats["sets"][2]["reps"] == 6

    # Verify sets on bench press
    bench = [ex for ex in data["exercises"] if ex["name"] == "Жим лежа"][0]
    assert len(bench["sets"]) == 2
    assert bench["sets"][1]["weight_kg"] == 55.0
    assert bench["sets"][1]["reps"] == 10

    # 2. Get workouts list
    get_resp = client.get("/workouts", headers=headers)
    assert get_resp.status_code == 200
    workouts_list = get_resp.json()
    assert len(workouts_list) == 1
    assert workouts_list[0]["title"] == "Утренняя тренировка"
    assert len(workouts_list[0]["exercises"]) == 2

    # 3. Add a new exercise with sets to the existing workout
    new_ex_data = {
        "name": "Подтягивания",
        "sets": [
            {"weight_kg": 0.0, "reps": 10},
            {"weight_kg": 0.0, "reps": 8}
        ]
    }
    add_resp = client.post(f"/workouts/{data['id']}/exercises", json=new_ex_data, headers=headers)
    assert add_resp.status_code == 200
    added_ex = add_resp.json()
    assert added_ex["name"] == "Подтягивания"
    assert len(added_ex["sets"]) == 2
    assert added_ex["sets"][0]["reps"] == 10

    # Verify cascading delete
    db_session.expire_all()
    workout_db = db_session.query(models.Workout).filter(models.Workout.id == data["id"]).first()
    assert workout_db is not None
    
    # Delete the user, which should trigger cascade deletes all the way down
    crud_resp = client.delete(f"/admin/users/{user.id}", headers=auth_headers(user.id)) # wait, let's just delete the user via DB session or direct call if user is admin
    # Actually, we can just call db_session.delete(user) and commit
    db_session.delete(user)
    db_session.commit()
    
    # Verify everything has cascade deleted
    assert db_session.query(models.Workout).filter(models.Workout.id == data["id"]).first() is None
    assert db_session.query(models.Exercise).filter(models.Exercise.workout_id == data["id"]).first() is None
    assert db_session.query(models.ExerciseSet).filter(models.ExerciseSet.exercise_id == squats["id"]).first() is None
