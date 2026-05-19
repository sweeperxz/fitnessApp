"""add_exercise_sets

Revision ID: f73962b7c0d5
Revises: 3687823d0d3e
Create Date: 2026-05-20 00:50:51.074659

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f73962b7c0d5'
down_revision = '3687823d0d3e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create table exercise_sets
    op.create_table('exercise_sets',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('exercise_id', sa.Integer(), nullable=False),
    sa.Column('weight_kg', sa.Float(), nullable=False),
    sa.Column('reps', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exercise_sets_exercise_id'), 'exercise_sets', ['exercise_id'], unique=False)
    op.create_index(op.f('ix_exercise_sets_id'), 'exercise_sets', ['id'], unique=False)

    # 2. Query old exercises and migrate data to exercise_sets
    connection = op.get_bind()
    exercises = connection.execute(sa.text("SELECT id, sets, reps, weight_kg FROM exercises")).fetchall()
    
    for exercise in exercises:
        exercise_id = exercise[0]
        sets_count = exercise[1]
        reps_count = exercise[2]
        weight = exercise[3]
        
        if not sets_count or sets_count <= 0:
            sets_count = 1
        if reps_count is None:
            reps_count = 0
        if weight is None:
            weight = 0.0
            
        for _ in range(sets_count):
            connection.execute(
                sa.text("INSERT INTO exercise_sets (exercise_id, weight_kg, reps, created_at) "
                        "VALUES (:exercise_id, :weight_kg, :reps, CURRENT_TIMESTAMP)"),
                {"exercise_id": exercise_id, "weight_kg": weight, "reps": reps_count}
            )

    # 3. Modify exercises table: drop old columns and update foreign key safely using batch_alter_table
    inspector = sa.inspect(connection)
    ex_fks = [fk['name'] for fk in inspector.get_foreign_keys('exercises')]
    
    with op.batch_alter_table('exercises') as batch_op:
        for fk_name in ex_fks:
            if fk_name and ('workout_id' in fk_name or 'fkey' in fk_name):
                batch_op.drop_constraint(fk_name, type_='foreignkey')
        batch_op.create_foreign_key('exercises_workout_id_fkey', 'workouts', ['workout_id'], ['id'], ondelete='CASCADE')
        batch_op.drop_column('reps')
        batch_op.drop_column('sets')
        batch_op.drop_column('weight_kg')


def downgrade() -> None:
    # 1. Restore columns in exercises
    with op.batch_alter_table('exercises') as batch_op:
        batch_op.add_column(sa.Column('weight_kg', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('sets', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('reps', sa.Integer(), nullable=True))

    # 2. Try to populate old columns with data from the first set of each exercise
    connection = op.get_bind()
    exercises = connection.execute(sa.text("SELECT id FROM exercises")).fetchall()
    for ex in exercises:
        ex_id = ex[0]
        # Get count and first set values
        sets_info = connection.execute(
            sa.text("SELECT count(*), min(reps), min(weight_kg) FROM exercise_sets WHERE exercise_id = :ex_id"),
            {"ex_id": ex_id}
        ).fetchone()
        if sets_info and sets_info[0] > 0:
            count, reps, weight = sets_info
            connection.execute(
                sa.text("UPDATE exercises SET sets = :sets, reps = :reps, weight_kg = :weight WHERE id = :ex_id"),
                {"sets": count, "reps": reps or 0, "weight": weight or 0.0, "ex_id": ex_id}
            )

    # 3. Restore exercises workout FK without CASCADE
    inspector = sa.inspect(connection)
    ex_fks = [fk['name'] for fk in inspector.get_foreign_keys('exercises')]
    with op.batch_alter_table('exercises') as batch_op:
        for fk_name in ex_fks:
            if fk_name and ('workout_id' in fk_name or 'fkey' in fk_name):
                batch_op.drop_constraint(fk_name, type_='foreignkey')
        batch_op.create_foreign_key('exercises_workout_id_fkey', 'workouts', ['workout_id'], ['id'])

    # 4. Drop exercise_sets
    op.drop_index(op.f('ix_exercise_sets_id'), table_name='exercise_sets')
    op.drop_index(op.f('ix_exercise_sets_exercise_id'), table_name='exercise_sets')
    op.drop_table('exercise_sets')
