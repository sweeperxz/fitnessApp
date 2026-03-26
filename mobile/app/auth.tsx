import { router } from 'expo-router';
import AuthPage from '../src/pages/AuthPage';
export default function AuthRoute() {
  return <AuthPage onAuth={() => router.replace('/')} />;
}

