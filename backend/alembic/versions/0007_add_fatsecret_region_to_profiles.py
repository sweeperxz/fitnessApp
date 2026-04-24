"""add fatsecret region to profiles

Revision ID: 0007
Revises: 0006
Create Date: 2026-04-23 23:59:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('profiles', sa.Column('fatsecret_region', sa.String(), nullable=True, server_default='default'))


def downgrade():
    op.drop_column('profiles', 'fatsecret_region')
