import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  date: Date;
}

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      token && setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const scheduleAlarmNotification = async (
    title: string,
    body: string,
    eventDateTime: Date,
    alarmOffset: string
  ): Promise<string | null> => {
    try {
      // Calculate alarm time based on offset
      const alarmTime = calculateAlarmTime(eventDateTime, alarmOffset);
      
      if (alarmTime <= new Date()) {
        console.warn('Alarm time is in the past, not scheduling');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🔔 ${title}`,
          body: `${body}\nEvent at ${eventDateTime.toLocaleTimeString()}`,
          data: { eventTitle: title, eventTime: eventDateTime.toISOString() },
        },
        trigger: {
          type: 'date',
          date: alarmTime,
        } as Notifications.DateTriggerInput,
      });

      console.log('Notification scheduled with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  };

  const getScheduledNotifications = async (): Promise<ScheduledNotification[]> => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.map(notif => ({
        id: notif.identifier,
        title: notif.content.title || '',
        body: notif.content.body || '',
        date: notif.trigger && 'date' in notif.trigger ? new Date(notif.trigger.date) : new Date(),
      }));
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    notification,
    scheduleAlarmNotification,
    cancelNotification,
    cancelAllNotifications,
    getScheduledNotifications,
  };
};

const calculateAlarmTime = (eventDateTime: Date, alarmOffset: string): Date => {
  const alarmTime = new Date(eventDateTime);
  
  switch (alarmOffset) {
    case '5 mins before':
      alarmTime.setMinutes(alarmTime.getMinutes() - 5);
      break;
    case '10 mins before':
      alarmTime.setMinutes(alarmTime.getMinutes() - 10);
      break;
    case '15 mins before':
      alarmTime.setMinutes(alarmTime.getMinutes() - 15);
      break;
    case '1 hour before':
      alarmTime.setHours(alarmTime.getHours() - 1);
      break;
    case '1 day before':
      alarmTime.setDate(alarmTime.getDate() - 1);
      break;
    default:
      alarmTime.setMinutes(alarmTime.getMinutes() - 5);
  }
  
  return alarmTime;
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
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
      alert('Failed to get push notification permissions!');
      return;
    }
    try {
      const projectId = "37a8b8b6-c1b2-4a07-b5f7-09b9e5b95349"; // Replace with your actual project ID
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
} 