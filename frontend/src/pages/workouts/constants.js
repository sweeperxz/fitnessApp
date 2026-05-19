export const MUSCLE_KEYS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio']

export const FALLBACK_EXERCISES = [
  { n: 'Жим лёжа', m: 'Chest' }, { n: 'Разводка гантелями', m: 'Chest' }, { n: 'Отжимания', m: 'Chest' }, { n: 'Кроссовер', m: 'Chest' },
  { n: 'Тяга верхнего блока', m: 'Back' }, { n: 'Тяга штанги в наклоне', m: 'Back' }, { n: 'Становая тяга', m: 'Back' }, { n: 'Подтягивания', m: 'Back' }, { n: 'Гиперэкстензия', m: 'Back' },
  { n: 'Приседания со штангой', m: 'Legs' }, { n: 'Жим ногами', m: 'Legs' }, { n: 'Выпады', m: 'Legs' }, { n: 'Сгибание ног', m: 'Legs' }, { n: 'Разгибание ног', m: 'Legs' }, { n: 'Подъём на носки', m: 'Legs' },
  { n: 'Жим гантелей сидя', m: 'Shoulders' }, { n: 'Армейский жим', m: 'Shoulders' }, { n: 'Махи в стороны', m: 'Shoulders' }, { n: 'Тяга к подбородку', m: 'Shoulders' },
  { n: 'Подъём штанги на бицепс', m: 'Biceps' }, { n: 'Молотковые сгибания', m: 'Biceps' },
  { n: 'Жим узким хватом', m: 'Triceps' }, { n: 'Разгибания на блоке', m: 'Triceps' }, { n: 'Французский жим', m: 'Triceps' },
  { n: 'Скручивания', m: 'Abs' }, { n: 'Планка', m: 'Abs' }, { n: 'Подъём ног', m: 'Abs' },
  { n: 'Бег', m: 'Cardio' }, { n: 'Скакалка', m: 'Cardio' }, { n: 'Велотренажёр', m: 'Cardio' }, { n: 'Эллипс', m: 'Cardio' },
]

export const MCOLORS = {
  Chest: '#a78bfa',
  Back: '#38bdf8',
  Legs: '#fbbf24',
  Shoulders: '#fb923c',
  Biceps: 'var(--accent3)',
  Triceps: 'var(--accent)',
  Abs: '#f43f5e',
  Cardio: '#ec4899',
}

export function getWeek(base) {
  const s = base.startOf('week')
  return Array.from({ length: 7 }, (_, i) => s.add(i, 'day'))
}
