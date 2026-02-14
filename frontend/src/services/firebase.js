import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { authApi } from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messaging = null;

// Initialize Firebase only if config is provided
try {
  if (firebaseConfig.apiKey) {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error.message);
}

/**
 * Request push notification permission and get FCM token
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn('Firebase not initialized');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // Send token to backend
      await authApi.updateFcmToken(token);
      console.log('FCM token registered');
      return token;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }

  return null;
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log('Foreground message:', payload);
    callback({
      title: payload.notification?.title || 'MedSource',
      body: payload.notification?.body || '',
      data: payload.data || {},
    });
  });
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
  return null;
}

export { messaging };
