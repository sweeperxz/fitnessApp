import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { enqueue, setupAutoFlush } from '../utils/offlineQueue';
import { errorHaptic } from '../utils/haptic';

// For local physical device testing, change localhost to your network IP (e.g. 192.168.x.x)
const api = axios.create({ baseURL: 'http://192.168.1.107:8000' });

export const getToken = async () => await AsyncStorage.getItem('ff_token');
export const setToken = async (t) => await AsyncStorage.setItem('ff_token', t);
export const removeToken = async () => await AsyncStorage.removeItem('ff_token');

api.interceptors.request.use(async cfg => {
  const t = await getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    // Auth error — logout (FastAPI HTTPBearer returns 403 on missing token, 401 on invalid token)
    // IMPORTANT: skip auth endpoints to avoid redirect loops on login/register failures
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/');
    if ((status === 401 || status === 403) && !isAuthEndpoint) {
        await removeToken();
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.replace('/auth');
    }


    // Network error on write request → save to offline queue
    if (!err.response && err.config) {
      const method = err.config.method;
      if (method === 'post' || method === 'delete') {
        errorHaptic();
        await enqueue(method, err.config.url, err.config.data ? JSON.parse(err.config.data) : null);
        // Return a fake success so the UI doesn't show an error
        return Promise.resolve({ data: { _offline: true } });
      }
      
      // For GET requests or others without a response
      err.isOffline = true;
    }

    // Capture standard offline from service worker mock responses if needed
    if (err.response?.data?.error === 'offline') {
      err.isOffline = true;
    }

    errorHaptic();
    return Promise.reject(err);
  }
);

// Auto-sync queued requests when back online
setupAutoFlush(api, (result) => {
  // In React Native we don't have window.dispatchEvent. 
  // Should use an Event Emitter or simply console for now
  console.log('nutrio:synced', result);
});

export const register = d => api.post('/auth/register', d).then(r => r.data);
export const login = d => api.post('/auth/login', d).then(r => r.data);
export const googleAuth = d => api.post('/auth/google', d).then(r => r.data);
export const getMe = () => api.get('/auth/me').then(r => r.data);

export const getProfile = () => api.get('/profile').then(r => r.data);
export const upsertProfile = d => api.post('/profile', d).then(r => r.data);

export const getNutritionDay = day => api.get(`/nutrition/${day}`).then(r => r.data);
export const addMeal = d => api.post('/nutrition/meal', d).then(r => r.data);
export const deleteMeal = id => api.delete(`/nutrition/meal/${id}`);
export const logWater = d => api.post('/nutrition/water', d).then(r => r.data);

export const getWorkouts = p => api.get('/workouts', { params: p }).then(r => r.data);
export const createWorkout = d => api.post('/workouts', d).then(r => r.data);
export const addExercise = (wid, d) => api.post(`/workouts/${wid}/exercises`, d).then(r => r.data);
export const deleteWorkout = id => api.delete(`/workouts/${id}`);

export const getStats = (days = 30) => api.get('/stats', { params: { days } }).then(r => r.data);

export const sendChatMessage = d => api.post('/ai/chat', d).then(r => r.data);

export const getRecentFoods = () => api.get('/foods/recent').then(r => r.data);
export const addRecentFood = d => api.post('/foods/recent', d).then(r => r.data);

export const getAdminUsers = () => api.get('/admin/users').then(r => r.data);
export const updateAdminUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role }).then(r => r.data);
export const deleteAdminUser = id => api.delete(`/admin/users/${id}`).then(r => r.data);

export default api;
