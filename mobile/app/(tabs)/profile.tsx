import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfilePage from '../../src/pages/ProfilePage';

export default function TabProfile() {
  return <ProfilePage onLogout={async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/auth');
  }} />;
}
