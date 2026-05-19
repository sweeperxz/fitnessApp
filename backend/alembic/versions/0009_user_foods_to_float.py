"""user_foods kbzhu int -> float

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-04 12:00:00.000000

В Meal все КБЖУ-поля — Float, в UserFood («недавние продукты»)
исторически были Integer. Из-за этого при сохранении продукта в
«недавние» десятичная часть значений терялась (23.3 → 23), и при
повторном использовании юзер получал уже урезанные значения.

Эта миграция переводит colonok user_foods.{calories,protein,fat,carbs}
в DOUBLE PRECISION. Для Postgres конверсия Integer → Float безопасна
без USING-cast'а; для SQLite (тесты) op.alter_column в большинстве
случаев no-op, но миграция формально определена ради совместимости.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user_foods') as batch:
        batch.alter_column(
            'calories',
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=True,
        )
        batch.alter_column(
            'protein',
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=True,
        )
        batch.alter_column(
            'fat',
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=True,
        )
        batch.alter_column(
            'carbs',
            existing_type=sa.Integer(),
            type_=sa.Float(),
            existing_nullable=True,
        )


def downgrade():
    with op.batch_alter_table('user_foods') as batch:
        batch.alter_column(
            'calories',
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=True,
        )
        batch.alter_column(
            'protein',
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=True,
        )
        batch.alter_column(
            'fat',
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=True,
        )
        batch.alter_column(
            'carbs',
            existing_type=sa.Float(),
            type_=sa.Integer(),
            existing_nullable=True,
        )
