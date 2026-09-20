import { Tabs } from 'expo-router';

import { Icon } from '@/src/components/Icon';
import { colors } from '@/src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Closet',
          tabBarIcon: ({ color, size }) => <Icon name="tshirt.fill" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          tabBarIcon: ({ color, size }) => <Icon name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="evaluate"
        options={{
          title: 'Evaluate',
          tabBarIcon: ({ color, size }) => <Icon name="camera.fill" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Icon name="clock.fill" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon name="gearshape.fill" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
