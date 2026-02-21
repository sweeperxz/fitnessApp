"""add users table and migrate to user_id

Revision ID: 0002
Revises: 0001
Create Date: 2026-02-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('name', sa.String(), server_default=''),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Drop old tables and recreate with user_id
    op.drop_table('exercises')
    op.drop_table('workouts')
    op.drop_table('water_logs')
    op.drop_table('meals')
    op.drop_table('profiles')

    op.create_table(
        'profiles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), unique=True, index=True),
        sa.Column('weight', sa.Float(), server_default='70'),
        sa.Column('goal', sa.String(), server_default=''),
        sa.Column('activity', sa.String(), server_default='medium'),
        sa.Column('water_goal', sa.Integer(), server_default='2500'),
        sa.Column('calories_goal', sa.Integer(), server_default='2000'),
        sa.Column('protein_goal', sa.Integer(), server_default='150'),
        sa.Column('fat_goal', sa.Integer(), server_default='70'),
        sa.Column('carbs_goal', sa.Integer(), server_default='250'),
    )

    op.create_table(
        'meals',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('day', sa.Date()),
        sa.Column('meal_type', sa.String()),
        sa.Column('name', sa.String()),
        sa.Column('calories', sa.Float(), server_default='0'),
        sa.Column('protein', sa.Float(), server_default='0'),
        sa.Column('fat', sa.Float(), server_default='0'),
        sa.Column('carbs', sa.Float(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'water_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('day', sa.Date()),
        sa.Column('amount_ml', sa.Integer()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'workouts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), index=True),
        sa.Column('day', sa.Date()),
        sa.Column('title', sa.String(), server_default='Тренировка'),
        sa.Column('notes', sa.String(), server_default=''),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'exercises',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('workout_id', sa.Integer(), sa.ForeignKey('workouts.id')),
        sa.Column('name', sa.String()),
        sa.Column('sets', sa.Integer(), server_default='3'),
        sa.Column('reps', sa.Integer(), server_default='10'),
        sa.Column('weight_kg', sa.Float(), server_default='0'),
    )

def downgrade():
    pass
