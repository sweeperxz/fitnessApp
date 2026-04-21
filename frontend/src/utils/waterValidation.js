export const MAX_DAILY_WATER = 10000
export const MAX_SINGLE_INTAKE = 2000

export function validateWaterIntake(currentWaterMl, addMl, t) {
  if (addMl > MAX_SINGLE_INTAKE) {
    return {
      valid: false,
      message: t('today.water_warning_single') || `⚠️ Warning: Drinking more than ${MAX_SINGLE_INTAKE}ml at once can be dangerous. Please add smaller portions.`
    }
  }

  const newTotal = (currentWaterMl || 0) + addMl
  if (newTotal > MAX_DAILY_WATER) {
    return {
      valid: false,
      message: t('today.water_warning_daily') || `⚠️ Warning: Total water intake would exceed ${MAX_DAILY_WATER}ml (${MAX_DAILY_WATER / 1000}L) per day, which can be dangerous. Current: ${currentWaterMl || 0}ml`
    }
  }

  return { valid: true }
}
