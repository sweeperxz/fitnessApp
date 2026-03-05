import api from '../api'

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function checkPushSupport() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getSubscription() {
    if (!await checkPushSupport()) return null;
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
}

export async function subscribeUser(publicVapidKey) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    const subJson = subscription.toJSON();
    await api.post('/push/subscribe', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
    });

    return subscription;
}

export async function unsubscribeUser() {
    const subscription = await getSubscription();
    if (subscription) {
        await subscription.unsubscribe();
        // Optionially notify backend to remove subscription
    }
}
