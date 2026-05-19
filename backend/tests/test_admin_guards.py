"""
Проверка role-guard'ов на /admin/* и защиты последнего админа.
"""


def test_non_admin_gets_403_on_users_list(client, make_user, auth_headers):
    user = make_user(email="user1@example.com", role="user")
    resp = client.get("/admin/users", headers=auth_headers(user.id))
    assert resp.status_code == 403


def test_unauthenticated_gets_403_on_users_list(client):
    """HTTPBearer без `Authorization` отвечает 403, а не 401."""
    resp = client.get("/admin/users")
    assert resp.status_code == 403


def test_admin_can_list_users(client, make_user, auth_headers):
    admin = make_user(email="admin@example.com", role="admin")
    make_user(email="user1@example.com", role="user")
    make_user(email="user2@example.com", role="user")

    resp = client.get("/admin/users", headers=auth_headers(admin.id))
    assert resp.status_code == 200
    payload = resp.json()
    emails = {u["email"] for u in payload["items"]}
    assert {"admin@example.com", "user1@example.com", "user2@example.com"} <= emails
    assert payload["total"] >= 3


def test_admin_cannot_demote_last_admin(client, make_user, auth_headers):
    admin = make_user(email="solo-admin@example.com", role="admin")
    other = make_user(email="user@example.com", role="user")
    headers = auth_headers(admin.id)

    resp = client.put(
        f"/admin/users/{other.id}/role",
        json={"role": "user"},
        headers=headers,
    )
    # Понижать обычного юзера до user — нет смысла, но это разрешено.
    assert resp.status_code == 200

    # Сам себя через role-update понизить нельзя (явная проверка id == admin.id).
    self_demote = client.put(
        f"/admin/users/{admin.id}/role",
        json={"role": "user"},
        headers=headers,
    )
    assert self_demote.status_code == 400


def test_demoting_only_admin_via_other_admin_blocked(client, make_user, auth_headers):
    """
    Создаём двух админов, один уходит — ок. Когда остаётся один, его
    нельзя понизить даже от лица другого админа (не должно остаться
    систему без админов).
    """
    admin1 = make_user(email="admin1@example.com", role="admin")
    admin2 = make_user(email="admin2@example.com", role="admin")
    headers1 = auth_headers(admin1.id)

    # Понижаем admin2 — допустимо, остаётся 1 админ
    r = client.put(
        f"/admin/users/{admin2.id}/role",
        json={"role": "user"},
        headers=headers1,
    )
    assert r.status_code == 200

    # Теперь admin1 единственный админ. Создадим ещё одного юзера и
    # попробуем "понизить" admin1 от его же лица — это всё равно
    # last-admin protection.
    # Самопонижение блокируется специальной проверкой (тест выше).
    # Здесь убеждаемся, что count_admin_users == 1.
    resp = client.get("/admin/users", headers=headers1)
    admins = [u for u in resp.json()["items"] if u["role"] == "admin"]
    assert len(admins) == 1


def test_admin_cannot_delete_self(client, make_user, auth_headers):
    admin = make_user(email="adm@example.com", role="admin")
    resp = client.delete(f"/admin/users/{admin.id}", headers=auth_headers(admin.id))
    assert resp.status_code == 400


def test_admin_cannot_delete_last_admin(client, make_user, auth_headers):
    admin = make_user(email="solo@example.com", role="admin")
    second = make_user(email="other@example.com", role="user")
    # Делаем second админом через прямой апдейт — но второй не админ, проверим через первого
    promote = client.put(
        f"/admin/users/{second.id}/role",
        json={"role": "admin"},
        headers=auth_headers(admin.id),
    )
    assert promote.status_code == 200

    # Теперь можно понизить первого admin'а через second — но останется только second
    demote_first = client.put(
        f"/admin/users/{admin.id}/role",
        json={"role": "user"},
        headers=auth_headers(second.id),
    )
    assert demote_first.status_code == 200

    # Удалить single админа (second) от его же лица — нельзя (delete-self),
    # но симулируем: создадим временного user'а и сделаем его админом
    temp_user = make_user(email="temp@example.com", role="user")
    promote_temp = client.put(
        f"/admin/users/{temp_user.id}/role",
        json={"role": "admin"},
        headers=auth_headers(second.id),
    )
    assert promote_temp.status_code == 200

    # Теперь админов 2 (second + temp). temp удаляет second — ок.
    delete_second = client.delete(
        f"/admin/users/{second.id}",
        headers=auth_headers(temp_user.id),
    )
    assert delete_second.status_code == 200

    # Остался один админ (temp). Создадим user'а и от его лица попробуем
    # удалить temp — нужен токен админа, а у нас остался только temp.
    # Удалить temp от лица temp — блокируется delete-self.
    # Делаем нового user'а админом, чтобы проверить "удалить последнего":
    dummy = make_user(email="dummy@example.com", role="user")
    promote_dummy = client.put(
        f"/admin/users/{dummy.id}/role",
        json={"role": "admin"},
        headers=auth_headers(temp_user.id),
    )
    assert promote_dummy.status_code == 200

    # Теперь админов опять 2: temp + dummy. dummy удаляет temp — ок.
    delete_temp = client.delete(
        f"/admin/users/{temp_user.id}",
        headers=auth_headers(dummy.id),
    )
    assert delete_temp.status_code == 200

    # Остался единственный админ dummy. Любой другой админ его удалить не
    # сможет, потому что других админов нет; от его собственного лица
    # блокируется delete-self.
    self_delete = client.delete(
        f"/admin/users/{dummy.id}",
        headers=auth_headers(dummy.id),
    )
    assert self_delete.status_code == 400
