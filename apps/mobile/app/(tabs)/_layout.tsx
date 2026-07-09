import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAppStore } from '../../lib/store';
import { colors } from '../../lib/theme';

export default function TabsLayout() {
  const token = useAppStore((s) => s.token);
  if (!token) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Kuyruk',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🎶</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Şarkı İste',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔍</Text>,
        }}
      />
    </Tabs>
  );
}
