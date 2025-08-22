import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// App color scheme for dark theme
const Colors = {
  background: '#1a1a1a',
  border: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#6b7280',
} as const;

// Configure notification behavior for dark theme
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface ToastOptions {
  title: string;
  body?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const getColorForType = (type: ToastOptions['type']) => {
  switch (type) {
    case 'success': return Colors.success;
    case 'error': return Colors.error;
    case 'warning': return Colors.warning;
    case 'info':
    default: return Colors.info;
  }
};

const getEmojiForType = (type: ToastOptions['type']) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info':
    default: return 'ℹ️';
  }
};

class ToastService {
  private permissionsGranted = false;

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Configure notification channels for different toast types
        await Promise.all([
          Notifications.setNotificationChannelAsync('toast-success', {
            name: 'Success Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 150],
            lightColor: Colors.success,
            enableLights: true,
            enableVibrate: true,
          }),
          Notifications.setNotificationChannelAsync('toast-error', {
            name: 'Error Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 300, 100, 300],
            lightColor: Colors.error,
            enableLights: true,
            enableVibrate: true,
          }),
          Notifications.setNotificationChannelAsync('toast-warning', {
            name: 'Warning Notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 200],
            lightColor: Colors.warning,
            enableLights: true,
            enableVibrate: true,
          }),
          Notifications.setNotificationChannelAsync('toast-info', {
            name: 'Info Notifications',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 100],
            lightColor: Colors.info,
            enableLights: false,
            enableVibrate: false,
          }),
        ]);
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
      console.warn('Notifications not permitted, falling back to console log:', title, body);
      return;
    }

    try {
      const emoji = getEmojiForType(type);
      const color = getColorForType(type);
      
      // Construct styled title with emoji
      const styledTitle = `${emoji} ${title}`;
      
      // Ensure body is a valid string or undefined (not null)
      const validBody = body && body.trim() !== '' ? body : undefined;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: styledTitle,
          body: validBody,
          data: { 
            type,
            color,
            timestamp: Date.now(),
          },
          // Platform-specific styling
          ...(Platform.OS === 'android' && {
            color: color,
          }),
        },
        trigger: null, // Show immediately
        ...(Platform.OS === 'android' && {
          identifier: `toast-${type}-${Date.now()}`,
          categoryIdentifier: `toast-${type}`,
        }),
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

  async showWarning(title: string, body?: string): Promise<void> {
    return this.showToast({ title, body, type: 'warning' });
  }

  async showInfo(title: string, body?: string): Promise<void> {
    return this.showToast({ title, body, type: 'info' });
  }

  // Convenience method for connection success
  async showConnectionSuccess(serverUrl: string): Promise<void> {
    return this.showSuccess('Connected!', `Successfully connected to ${serverUrl}`);
  }

  // Convenience method for connection errors
  async showConnectionError(error: string): Promise<void> {
    return this.showError('Connection Failed', error);
  }
}

export const toast = new ToastService();