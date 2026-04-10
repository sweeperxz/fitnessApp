"""add indexes for created_at fields

Revision ID: 0006
Revises: 0005
Create Date: 2026-04-07 09:46:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    # Додаємо індекси для created_at полів для швидшого сортування
    op.create_index(op.f('ix_meals_created_at'), 'meals', ['created_at'], unique=False)
    op.create_index(op.f('ix_water_logs_created_at'), 'water_logs', ['created_at'], unique=False)
    op.create_index(op.f('ix_workouts_created_at'), 'workouts', ['created_at'], unique=False)
    op.create_index(op.f('ix_user_foods_last_used'), 'user_foods', ['last_used'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_user_foods_last_used'), table_name='user_foods')
    op.drop_index(op.f('ix_workouts_created_at'), table_name='workouts')
    op.drop_index(op.f('ix_water_logs_created_at'), table_name='water_logs')
    op.drop_index(op.f('ix_meals_created_at'), table_name='meals')
