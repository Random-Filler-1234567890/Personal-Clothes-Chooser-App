import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import type { ColorValue } from 'react-native';

import { Icon } from '@/src/components/Icon';
import { colors } from '@/src/constants/theme';

type IoniconName = ComponentProps<typeof Icon>['name'];

function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Icon name={focused ? filled : outline} size={size} color={color} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="closet"
        options={{ title: 'Closet', tabBarIcon: tabIcon('shirt-outline', 'shirt') }}
      />
      <Tabs.Screen
        name="generate"
        options={{ title: 'Generate', tabBarIcon: tabIcon('sparkles-outline', 'sparkles') }}
      />
      <Tabs.Screen
        name="evaluate"
        options={{ title: 'Evaluate', tabBarIcon: tabIcon('camera-outline', 'camera') }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarIcon: tabIcon('time-outline', 'time') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />
    </Tabs>
  );
}
