import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '../../src/contexts/ConnectionContext';

export default function TabLayout() {
  const { connectionStatus, sessions, lastError } = useConnection();

  const getTabIcon = (name: string, focused: boolean, color: string, size: number) => {
    const iconColor = connectionStatus === 'connected' ? color : '#4b5563';
    
    switch (name) {
      case 'index':
        return <Ionicons name="hardware-chip-outline" size={size} color={iconColor} />;
      case 'sessions':
        return (
          <>
            <Ionicons name="list-outline" size={size} color={iconColor} />
            {connectionStatus === 'connected' && sessions.length > 0 && (
              <Ionicons 
                name="ellipse" 
                size={8} 
                color="#10b981" 
                style={{ position: 'absolute', top: -2, right: -2 }} 
              />
            )}
          </>
        );
      case 'chat':
        return <Ionicons name="chatbubble-ellipses-outline" size={size} color={iconColor} />;
      default:
        return <Ionicons name="help-outline" size={size} color={iconColor} />;
    }
  };



  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#ffffff',
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#2a2a2a',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: connectionStatus === 'connected' ? 'Connected' : 'Connect',
          tabBarIcon: ({ color, size, focused }) => getTabIcon('index', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: `Sessions${connectionStatus === 'connected' && sessions.length > 0 ? ` (${sessions.length})` : ''}`,
          tabBarIcon: ({ color, size, focused }) => getTabIcon('sessions', focused, color, size),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => getTabIcon('chat', focused, color, size),
        }}
      />
    </Tabs>
  );
}
