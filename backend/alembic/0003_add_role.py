"""Add role column to users

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-05 11:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add the column. We use server_default='user' so existing rows get this value
    op.add_column('users', sa.Column('role', sa.String(), server_default='user', nullable=False))
    
    # Optionally, set the first user (id=1) as admin for easier testing
    op.execute("UPDATE users SET role = 'admin' WHERE id = 1")

def downgrade() -> None:
    op.drop_column('users', 'role')
