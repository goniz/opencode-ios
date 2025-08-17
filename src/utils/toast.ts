import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

export interface ToastOptions {
  title: string;
  body?: string;
  type?: 'success' | 'error' | 'info';
}

class ToastService {
  private permissionsGranted = false;

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      this.permissionsGranted = finalStatus === 'granted';
      return this.permissionsGranted;
    } catch (error) {
      console.warn('Failed to initialize notifications:', error);
      return false;
    }
  }

  async showToast({ title, body, type = 'info' }: ToastOptions): Promise<void> {
    if (!this.permissionsGranted) {
      await this.initialize();
    }

    if (!this.permissionsGranted) {
      console.warn('Notifications not permitted, falling back to console log:', title);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { type },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.warn('Failed to show toast notification:', error);
    }
  }

  async showSuccess(title: string, body?: string): Promise<void> {
    return this.showToast({ title, body, type: 'success' });
  }

  async showError(title: string, body?: string): Promise<void> {
    return this.showToast({ title, body, type: 'error' });
  }

  async showInfo(title: string, body?: string): Promise<void> {
    return this.showToast({ title, body, type: 'info' });
  }
}

export const toast = new ToastService();