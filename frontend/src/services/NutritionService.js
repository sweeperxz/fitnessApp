import api from '../api'

export const getNutritionDay = (day) => api.get(`/nutrition/${day}`).then(r => r.data)
export const addMeal = (data) => api.post('/nutrition/meal', data).then(r => r.data)
export const deleteMeal = (mealId) => api.delete(`/nutrition/meal/${mealId}`).then(r => r.data)
export const logWater = (data) => api.post('/nutrition/water', data).then(r => r.data)

export const getRecentFoods = () => api.get('/foods/recent').then(r => r.data)
export const addRecentFood = (data) => api.post('/foods/recent', data).then(r => r.data)

const NutritionService = {
  getNutritionDay,
  addMeal,
  deleteMeal,
  logWater,
  getRecentFoods,
  addRecentFood
}

export default NutritionService
