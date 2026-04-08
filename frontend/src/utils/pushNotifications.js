import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  let token;
  const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

  if (isExpoGo) {
    console.log('Push notifications are disabled in Expo Go SDK 53+');
    return null;
  }

  // Only dynamically import expo-notifications if not in Expo Go to avoid SDK 53 crash
  try {
    const Notifications = require('expo-notifications');
    
    // Set notification handler so notifications show up even when app is foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
      });
    }

    if (Device.isDevice) {
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
      if (projectId) {
         token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } else {
         token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    }
  } catch (e) {
    console.log('Error getting push token:', e);
  }

  return token;
}
