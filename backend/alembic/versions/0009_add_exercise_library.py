"""add exercise library

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


exercise_library = sa.table(
    'exercise_library',
    sa.column('name', sa.String),
    sa.column('muscle', sa.String),
    sa.column('equipment', sa.String),
    sa.column('description', sa.String),
    sa.column('is_active', sa.Boolean),
)


SEED_EXERCISES = [
    {'name': 'Жим лёжа', 'muscle': 'Chest', 'equipment': 'Штанга', 'description': 'Базовое упражнение для грудных мышц, трицепсов и передней дельты.', 'is_active': True},
    {'name': 'Разводка гантелями', 'muscle': 'Chest', 'equipment': 'Гантели', 'description': 'Изолирующее упражнение для грудных мышц.', 'is_active': True},
    {'name': 'Отжимания', 'muscle': 'Chest', 'equipment': 'Собственный вес', 'description': 'Базовое упражнение с собственным весом для груди и трицепсов.', 'is_active': True},
    {'name': 'Кроссовер', 'muscle': 'Chest', 'equipment': 'Кроссовер', 'description': 'Изолирующее сведение рук в блоках для грудных мышц.', 'is_active': True},
    {'name': 'Тяга верхнего блока', 'muscle': 'Back', 'equipment': 'Блок', 'description': 'Тяговое упражнение для широчайших мышц спины.', 'is_active': True},
    {'name': 'Тяга штанги в наклоне', 'muscle': 'Back', 'equipment': 'Штанга', 'description': 'Базовая горизонтальная тяга для спины.', 'is_active': True},
    {'name': 'Становая тяга', 'muscle': 'Back', 'equipment': 'Штанга', 'description': 'Базовое силовое упражнение для задней цепи и спины.', 'is_active': True},
    {'name': 'Подтягивания', 'muscle': 'Back', 'equipment': 'Турник', 'description': 'Вертикальная тяга с собственным весом.', 'is_active': True},
    {'name': 'Гиперэкстензия', 'muscle': 'Back', 'equipment': 'Тренажёр', 'description': 'Упражнение для разгибателей спины и ягодичных.', 'is_active': True},
    {'name': 'Приседания со штангой', 'muscle': 'Legs', 'equipment': 'Штанга', 'description': 'Базовое упражнение для ног и корпуса.', 'is_active': True},
    {'name': 'Жим ногами', 'muscle': 'Legs', 'equipment': 'Тренажёр', 'description': 'Жим платформы ногами для квадрицепсов и ягодичных.', 'is_active': True},
    {'name': 'Выпады', 'muscle': 'Legs', 'equipment': 'Собственный вес', 'description': 'Одностороннее упражнение для ног и баланса.', 'is_active': True},
    {'name': 'Сгибание ног', 'muscle': 'Legs', 'equipment': 'Тренажёр', 'description': 'Изолирующее упражнение для бицепса бедра.', 'is_active': True},
    {'name': 'Разгибание ног', 'muscle': 'Legs', 'equipment': 'Тренажёр', 'description': 'Изолирующее упражнение для квадрицепса.', 'is_active': True},
    {'name': 'Подъём на носки', 'muscle': 'Legs', 'equipment': 'Тренажёр', 'description': 'Упражнение для икроножных мышц.', 'is_active': True},
    {'name': 'Жим гантелей сидя', 'muscle': 'Shoulders', 'equipment': 'Гантели', 'description': 'Базовый жим для дельтовидных мышц.', 'is_active': True},
    {'name': 'Армейский жим', 'muscle': 'Shoulders', 'equipment': 'Штанга', 'description': 'Вертикальный жим стоя для плечевого пояса.', 'is_active': True},
    {'name': 'Махи в стороны', 'muscle': 'Shoulders', 'equipment': 'Гантели', 'description': 'Изолирующее упражнение для средней дельты.', 'is_active': True},
    {'name': 'Тяга к подбородку', 'muscle': 'Shoulders', 'equipment': 'Штанга', 'description': 'Тяга для дельт и трапеций.', 'is_active': True},
    {'name': 'Подъём штанги на бицепс', 'muscle': 'Biceps', 'equipment': 'Штанга', 'description': 'Базовое сгибание рук для бицепса.', 'is_active': True},
    {'name': 'Молотковые сгибания', 'muscle': 'Biceps', 'equipment': 'Гантели', 'description': 'Сгибание рук нейтральным хватом для бицепса и брахиалиса.', 'is_active': True},
    {'name': 'Жим узким хватом', 'muscle': 'Triceps', 'equipment': 'Штанга', 'description': 'Жимовое упражнение с акцентом на трицепс.', 'is_active': True},
    {'name': 'Разгибания на блоке', 'muscle': 'Triceps', 'equipment': 'Блок', 'description': 'Изолирующее разгибание рук на трицепс.', 'is_active': True},
    {'name': 'Французский жим', 'muscle': 'Triceps', 'equipment': 'Штанга', 'description': 'Изолирующее упражнение для трицепса.', 'is_active': True},
    {'name': 'Скручивания', 'muscle': 'Abs', 'equipment': 'Собственный вес', 'description': 'Базовое упражнение для прямой мышцы живота.', 'is_active': True},
    {'name': 'Планка', 'muscle': 'Abs', 'equipment': 'Собственный вес', 'description': 'Статическое упражнение для мышц кора.', 'is_active': True},
    {'name': 'Подъём ног', 'muscle': 'Abs', 'equipment': 'Собственный вес', 'description': 'Упражнение для пресса с акцентом на нижнюю часть.', 'is_active': True},
    {'name': 'Бег', 'muscle': 'Cardio', 'equipment': 'Без оборудования', 'description': 'Кардио-нагрузка для развития выносливости.', 'is_active': True},
    {'name': 'Скакалка', 'muscle': 'Cardio', 'equipment': 'Скакалка', 'description': 'Кардио и координационная нагрузка.', 'is_active': True},
    {'name': 'Велотренажёр', 'muscle': 'Cardio', 'equipment': 'Велотренажёр', 'description': 'Кардио-нагрузка с низкой ударной нагрузкой.', 'is_active': True},
    {'name': 'Эллипс', 'muscle': 'Cardio', 'equipment': 'Эллиптический тренажёр', 'description': 'Кардио-нагрузка для всего тела.', 'is_active': True},
]


def upgrade():
    op.create_table(
        'exercise_library',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('muscle', sa.String(), nullable=False),
        sa.Column('equipment', sa.String(), nullable=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_exercise_library_name'), 'exercise_library', ['name'], unique=False)
    op.create_index(op.f('ix_exercise_library_muscle'), 'exercise_library', ['muscle'], unique=False)
    op.create_index('ix_exercise_library_muscle_name', 'exercise_library', ['muscle', 'name'], unique=False)
    op.create_index(op.f('ix_exercise_library_equipment'), 'exercise_library', ['equipment'], unique=False)
    op.bulk_insert(exercise_library, SEED_EXERCISES)

    op.add_column('exercises', sa.Column('library_exercise_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_exercises_library_exercise_id'), 'exercises', ['library_exercise_id'], unique=False)
    op.create_foreign_key(
        'fk_exercises_library_exercise_id_exercise_library',
        'exercises',
        'exercise_library',
        ['library_exercise_id'],
        ['id'],
    )


def downgrade():
    op.drop_constraint('fk_exercises_library_exercise_id_exercise_library', 'exercises', type_='foreignkey')
    op.drop_index(op.f('ix_exercises_library_exercise_id'), table_name='exercises')
    op.drop_column('exercises', 'library_exercise_id')
    op.drop_index(op.f('ix_exercise_library_equipment'), table_name='exercise_library')
    op.drop_index('ix_exercise_library_muscle_name', table_name='exercise_library')
    op.drop_index(op.f('ix_exercise_library_muscle'), table_name='exercise_library')
    op.drop_index(op.f('ix_exercise_library_name'), table_name='exercise_library')
    op.drop_table('exercise_library')
