"""
Админ-роутер: управление пользователями. Все мутации требуют CSRF-токен.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from auth import get_admin_user, get_db
from csrf import require_csrf, verify_csrf_token

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[schemas.UserAdminResponse])
def get_all_users(
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    limit = min(limit, 100)
    return (
        db.query(models.User)
        .order_by(models.User.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.put("/users/{user_id}/role", response_model=schemas.UserAdminResponse)
def update_role(
    user_id: int,
    data: schemas.UserRoleUpdate,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    csrf_token: str = Depends(require_csrf),
):
    if not verify_csrf_token(csrf_token, admin.id):
        raise HTTPException(403, "Невалідний CSRF токен")

    if user_id == admin.id and data.role != "admin":
        raise HTTPException(400, "Нельзя снять роль администратора самому себе")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(404, "Пользователь не найден")

    if target_user.role == "admin" and data.role != "admin":
        if crud.count_admin_users(db) <= 1:
            raise HTTPException(
                400,
                detail={
                    "code": "LAST_ADMIN_PROTECTED",
                    "message": "Нельзя снять роль у последнего администратора",
                },
            )

    return crud.update_user_role(db, user_id, data.role)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    csrf_token: str = Depends(require_csrf),
):
    if not verify_csrf_token(csrf_token, admin.id):
        raise HTTPException(403, "Невалідний CSRF токен")
    if user_id == admin.id:
        raise HTTPException(400, "Нельзя удалить самого себя")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(404, "Пользователь не найден")

    if target_user.role == "admin" and crud.count_admin_users(db) <= 1:
        raise HTTPException(
            400,
            detail={
                "code": "LAST_ADMIN_PROTECTED",
                "message": "Нельзя удалить последнего администратора",
            },
        )

    if not crud.delete_user(db, user_id):
        raise HTTPException(404, "Пользователь не найден")
    return {"ok": True}
