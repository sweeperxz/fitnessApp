"""fix_db_issues

Revision ID: 3687823d0d3e
Revises: 0010
Create Date: 2026-05-20 00:48:18.766153

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3687823d0d3e'
down_revision = '0010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    # 1. Handle exercise_library unique constraint and index alignment
    # Check if constraint exists before dropping
    el_constraints = inspector.get_unique_constraints('exercise_library')
    el_constraint_names = [c['name'] for c in el_constraints]
    if 'exercise_library_name_key' in el_constraint_names:
        op.drop_constraint('exercise_library_name_key', 'exercise_library', type_='unique')

    # Check and drop index ix_exercise_library_equipment
    el_indexes = [idx['name'] for idx in inspector.get_indexes('exercise_library')]
    if 'ix_exercise_library_equipment' in el_indexes:
        op.drop_index('ix_exercise_library_equipment', table_name='exercise_library')
    if 'ix_exercise_library_name' in el_indexes:
        op.drop_index('ix_exercise_library_name', table_name='exercise_library')
    op.create_index(op.f('ix_exercise_library_name'), 'exercise_library', ['name'], unique=True)

    # 2. Handle push_subscriptions foreign key update to cascade on delete
    if 'push_subscriptions' in tables:
        push_fks = [fk['name'] for fk in inspector.get_foreign_keys('push_subscriptions')]
        for fk_name in push_fks:
            if fk_name and ('user_id' in fk_name or 'fkey' in fk_name):
                op.drop_constraint(fk_name, 'push_subscriptions', type_='foreignkey')
        op.create_foreign_key('push_subscriptions_user_id_fkey', 'push_subscriptions', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # 3. Create or update sync_operations table
    if 'sync_operations' not in tables:
        op.create_table(
            'sync_operations',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('op_id', sa.String(), nullable=False),
            sa.Column('operation_type', sa.String(), nullable=False),
            sa.Column('resource_type', sa.String(), nullable=False),
            sa.Column('resource_id', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='sync_operations_user_id_fkey', ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_sync_operations_user_id'), 'sync_operations', ['user_id'], unique=False)
        op.create_index('ix_sync_user_opid_unique', 'sync_operations', ['user_id', 'op_id'], unique=True)
    else:
        sync_fks = [fk['name'] for fk in inspector.get_foreign_keys('sync_operations')]
        for fk_name in sync_fks:
            if fk_name and ('user_id' in fk_name or 'fkey' in fk_name):
                op.drop_constraint(fk_name, 'sync_operations', type_='foreignkey')
        op.create_foreign_key('sync_operations_user_id_fkey', 'sync_operations', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # 4. Alter user_foods macros to Float
    op.alter_column('user_foods', 'calories',
               existing_type=sa.INTEGER(),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('user_foods', 'protein',
               existing_type=sa.INTEGER(),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('user_foods', 'fat',
               existing_type=sa.INTEGER(),
               type_=sa.Float(),
               existing_nullable=True)
    op.alter_column('user_foods', 'carbs',
               existing_type=sa.INTEGER(),
               type_=sa.Float(),
               existing_nullable=True)

    # 5. Alter user_foods barcode unique constraint to a partial index
    uf_indexes = [idx['name'] for idx in inspector.get_indexes('user_foods')]
    if 'ix_user_foods_barcode' in uf_indexes:
        op.drop_index('ix_user_foods_barcode', table_name='user_foods')
    op.create_index(op.f('ix_user_foods_barcode'), 'user_foods', ['barcode'], unique=False)
    op.create_index('ix_user_foods_global_barcode', 'user_foods', ['barcode'], unique=True, postgresql_where=sa.text('user_id IS NULL'))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1. Downgrade barcode indexes
    op.drop_index('ix_user_foods_global_barcode', table_name='user_foods', postgresql_where=sa.text('user_id IS NULL'))
    op.drop_index(op.f('ix_user_foods_barcode'), table_name='user_foods')
    op.create_index('ix_user_foods_barcode', 'user_foods', ['barcode'], unique=True)

    # 2. Downgrade Float columns back to Integer
    op.alter_column('user_foods', 'carbs',
               existing_type=sa.Float(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('user_foods', 'fat',
               existing_type=sa.Float(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('user_foods', 'protein',
               existing_type=sa.Float(),
               type_=sa.INTEGER(),
               existing_nullable=True)
    op.alter_column('user_foods', 'calories',
               existing_type=sa.Float(),
               type_=sa.INTEGER(),
               existing_nullable=True)

    # 3. Restore sync_operations FK without CASCADE
    sync_fks = [fk['name'] for fk in inspector.get_foreign_keys('sync_operations')]
    for fk_name in sync_fks:
        if fk_name and ('user_id' in fk_name or 'fkey' in fk_name):
            op.drop_constraint(fk_name, 'sync_operations', type_='foreignkey')
    op.create_foreign_key('sync_operations_user_id_fkey', 'sync_operations', 'users', ['user_id'], ['id'])

    # 4. Restore push_subscriptions FK without CASCADE
    push_fks = [fk['name'] for fk in inspector.get_foreign_keys('push_subscriptions')]
    for fk_name in push_fks:
        if fk_name and ('user_id' in fk_name or 'fkey' in fk_name):
            op.drop_constraint(fk_name, 'push_subscriptions', type_='foreignkey')
    op.create_foreign_key('push_subscriptions_user_id_fkey', 'push_subscriptions', 'users', ['user_id'], ['id'])

    # 5. Restore exercise_library constraints
    op.drop_index(op.f('ix_exercise_library_name'), table_name='exercise_library')
    op.create_index('ix_exercise_library_name', 'exercise_library', ['name'], unique=False)
    op.create_index('ix_exercise_library_equipment', 'exercise_library', ['equipment'], unique=False)
    op.create_unique_constraint('exercise_library_name_key', 'exercise_library', ['name'])
