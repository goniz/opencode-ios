import { Stack } from 'expo-router';
import { ConnectionProvider } from '../src/contexts/ConnectionContext';

export default function RootLayout() {
  return (
    <ConnectionProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ConnectionProvider>
  );
}
