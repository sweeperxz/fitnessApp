export function parseOFF(p) {
    const n = p.nutriments || {}

    // Умный поиск калорий: если нет ккал, берем джоули и переводим в ккал (делим на 4.184)
    let kcal = n['energy-kcal_100g'] || n['energy-kcal_value'] || 0;
    if (!kcal && n['energy_100g']) kcal = n['energy_100g'] / 4.184;

    return {
        name: p.product_name_ua || p.product_name_ru || p.product_name || p.brands || 'Без названия',
        brand: p.brands || '',
        calories: Math.round(kcal),
        // Также страхуемся по БЖУ, проверяя запасные поля _value
        protein: Math.round(n.proteins_100g || n.proteins_value || 0),
        fat: Math.round(n.fat_100g || n.fat_value || 0),
        carbs: Math.round(n.carbohydrates_100g || n.carbohydrates_value || 0),
    }
}
