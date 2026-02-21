"""Initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2025-01-01 00:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('telegram_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('name', sa.String(), server_default=''),
        sa.Column('weight', sa.Float(), server_default='70'),
        sa.Column('goal', sa.String(), server_default='maintain'),
        sa.Column('activity', sa.String(), server_default='medium'),
        sa.Column('water_goal', sa.Integer(), server_default='2500'),
        sa.Column('calories_goal', sa.Integer(), server_default='2000'),
        sa.Column('protein_goal', sa.Integer(), server_default='150'),
        sa.Column('fat_goal', sa.Integer(), server_default='70'),
        sa.Column('carbs_goal', sa.Integer(), server_default='250'),
    )
    op.create_index('ix_profiles_telegram_id', 'profiles', ['telegram_id'])

    op.create_table('meals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('telegram_id', sa.Integer(), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('meal_type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('calories', sa.Float(), server_default='0'),
        sa.Column('protein', sa.Float(), server_default='0'),
        sa.Column('fat', sa.Float(), server_default='0'),
        sa.Column('carbs', sa.Float(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_meals_telegram_id', 'meals', ['telegram_id'])
    op.create_index('ix_meals_day', 'meals', ['telegram_id', 'day'])

    op.create_table('water_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('telegram_id', sa.Integer(), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('amount_ml', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_water_logs_telegram_id', 'water_logs', ['telegram_id'])

    op.create_table('workouts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('telegram_id', sa.Integer(), nullable=False),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('title', sa.String(), server_default='Тренировка'),
        sa.Column('notes', sa.String(), server_default=''),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_workouts_telegram_id', 'workouts', ['telegram_id'])

    op.create_table('exercises',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workout_id', sa.Integer(), sa.ForeignKey('workouts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('sets', sa.Integer(), server_default='3'),
        sa.Column('reps', sa.Integer(), server_default='10'),
        sa.Column('weight_kg', sa.Float(), server_default='0'),
    )
    op.create_index('ix_exercises_workout_id', 'exercises', ['workout_id'])


def downgrade() -> None:
    op.drop_table('exercises')
    op.drop_table('workouts')
    op.drop_table('water_logs')
    op.drop_table('meals')
    op.drop_table('profiles')
