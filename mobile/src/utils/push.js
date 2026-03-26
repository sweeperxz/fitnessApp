import api from '../api/index';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function checkPushSupport() {
    return Device.isDevice;
}

export async function getSubscription() {
    if (!await checkPushSupport()) return null;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
        const pushTokenString = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
        return pushTokenString;
    }
    return null;
}

export async function subscribeUser() {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return null;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId,
    })).data;

    // Send token to backend
    await api.post('/push/subscribe', { token: pushTokenString, os: Platform.OS });

    return pushTokenString;
}

export async function unsubscribeUser() {
    // Usually managed per-user in backend
}
