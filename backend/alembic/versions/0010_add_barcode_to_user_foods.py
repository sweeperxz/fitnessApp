"""add barcode to user foods

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-19 23:48:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0010'
down_revision = '0009'
branch_labels = None
depends_on = None


def upgrade():
    # Add barcode column
    op.add_column('user_foods', sa.Column('barcode', sa.String(), nullable=True))
    op.create_index(op.f('ix_user_foods_barcode'), 'user_foods', ['barcode'], unique=True)
    
    # Make user_id nullable so we can have global items
    op.alter_column('user_foods', 'user_id', existing_type=sa.Integer(), nullable=True)


def downgrade():
    # Make user_id non-nullable again
    op.alter_column('user_foods', 'user_id', existing_type=sa.Integer(), nullable=False)
    
    # Drop barcode column and index
    op.drop_index(op.f('ix_user_foods_barcode'), table_name='user_foods')
    op.drop_column('user_foods', 'barcode')
