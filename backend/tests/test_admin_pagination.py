"""
Регрессии на пагинацию /admin/users.

Раньше /admin/users отдавал просто `list[UserAdminResponse]` с дефолтным
limit=50. На фронте никакого UI «следующая страница» не было — после
50-го юзера админ просто не видел остальных. После N7 теперь:
  - response is `{ items, total, skip, limit }`
  - skip/limit честно прокидываются и валидируются
  - total отражает count'ом всю таблицу, а не длину страницы
"""


def test_admin_users_returns_pagination_envelope(client, make_user, auth_headers):
    admin = make_user(email="adm-page@example.com", role="admin")
    for i in range(5):
        make_user(email=f"u{i}@example.com", role="user")

    resp = client.get("/admin/users", headers=auth_headers(admin.id))
    assert resp.status_code == 200
    body = resp.json()
    # 5 юзеров + 1 админ = минимум 6
    assert body["total"] >= 6
    assert body["skip"] == 0
    assert body["limit"] == 50
    assert isinstance(body["items"], list)
    assert len(body["items"]) <= body["limit"]


def test_admin_users_respects_skip_and_limit(client, make_user, auth_headers):
    admin = make_user(email="page-admin@example.com", role="admin")
    for i in range(10):
        make_user(email=f"page-u{i}@example.com", role="user")

    page1 = client.get(
        "/admin/users?skip=0&limit=4",
        headers=auth_headers(admin.id),
    ).json()
    assert page1["limit"] == 4
    assert page1["skip"] == 0
    assert len(page1["items"]) == 4

    page2 = client.get(
        "/admin/users?skip=4&limit=4",
        headers=auth_headers(admin.id),
    ).json()
    assert page2["skip"] == 4
    # Никаких пересечений между страницами при стабильной сортировке.
    assert {u["id"] for u in page1["items"]}.isdisjoint(
        {u["id"] for u in page2["items"]}
    )
    # Total один и тот же на обеих страницах.
    assert page1["total"] == page2["total"]


def test_admin_users_total_independent_from_limit(client, make_user, auth_headers):
    admin = make_user(email="t-admin@example.com", role="admin")
    for i in range(7):
        make_user(email=f"t-u{i}@example.com", role="user")

    short = client.get(
        "/admin/users?limit=2",
        headers=auth_headers(admin.id),
    ).json()
    long_ = client.get(
        "/admin/users?limit=20",
        headers=auth_headers(admin.id),
    ).json()

    # 7 юзеров + 1 админ = 8 всего, total отражает реальный count, а не
    # длину выданного среза.
    assert short["total"] == long_["total"]
    assert short["total"] >= 8
    assert len(short["items"]) == 2


def test_admin_users_rejects_invalid_pagination(client, make_user, auth_headers):
    admin = make_user(email="bad-page@example.com", role="admin")
    headers = auth_headers(admin.id)

    # skip < 0
    assert client.get("/admin/users?skip=-1", headers=headers).status_code == 422
    # limit > 100 (защита от тяжёлых запросов админа)
    assert client.get("/admin/users?limit=999", headers=headers).status_code == 422
    # limit < 1
    assert client.get("/admin/users?limit=0", headers=headers).status_code == 422
