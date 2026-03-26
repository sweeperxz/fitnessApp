import React from 'react';
import { Sun, Navigation, Moon, Heart } from 'lucide-react-native';

export const MEAL_TYPES = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

export const MealIcons = {
    Завтрак: <Sun size={16} color="currentColor" />,
    Обед: <Navigation size={16} color="currentColor" />,
    Ужин: <Moon size={16} color="currentColor" />,
    Перекус: <Heart size={16} color="currentColor" />,
};
