"""add height, age, gender to profiles

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-01 12:00:00.000000

Сохраняет height/age/gender в профиле, чтобы кнопка "Рассчитать цели"
на ProfilePage не хардкодила 175см / 30лет / male, а использовала
реальные данные пользователя из onboarding.

Дефолты на миграции — те же значения, которые раньше хардкодились
на бэке (вычистил в PR #1) и продолжали хардкодиться на фронте.
Это даёт обратную совместимость для существующих юзеров: их цели
до пересчёта останутся как были, а после нажатия "Рассчитать" они
смогут отредактировать height/age/gender на UI.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'profiles',
        sa.Column('height', sa.Float(), nullable=True),
    )
    op.add_column(
        'profiles',
        sa.Column('age', sa.Integer(), nullable=True),
    )
    op.add_column(
        'profiles',
        sa.Column('gender', sa.String(), nullable=True),
    )


def downgrade():
    op.drop_column('profiles', 'gender')
    op.drop_column('profiles', 'age')
    op.drop_column('profiles', 'height')
