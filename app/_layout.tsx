import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConnectionProvider } from '../src/contexts/ConnectionContext';

export default function RootLayout() {
  return (
    <ConnectionProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </ConnectionProvider>
  );
}
