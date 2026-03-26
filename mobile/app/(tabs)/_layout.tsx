import { Tabs, router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Home, Dumbbell, BarChart3, Bot, User } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    AsyncStorage.getItem('ff_token').then(token => {
      if (!token) router.replace('/auth');
    });
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(7,8,15,0.95)',
          borderTopColor: 'rgba(255,255,255,0.13)',
          height: 60,
          paddingBottom: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color }) => <Dumbbell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <BarChart3 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Coach',
          tabBarIcon: ({ color }) => <Bot size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
