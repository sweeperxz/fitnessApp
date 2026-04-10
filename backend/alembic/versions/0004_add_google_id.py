"""add google_id to users

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-07 09:42:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    # Додаємо поле google_id
    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)

    # Робимо password_hash nullable для OAuth користувачів
    op.alter_column('users', 'password_hash',
                    existing_type=sa.String(),
                    nullable=True)


def downgrade():
    op.alter_column('users', 'password_hash',
                    existing_type=sa.String(),
                    nullable=False)
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')
