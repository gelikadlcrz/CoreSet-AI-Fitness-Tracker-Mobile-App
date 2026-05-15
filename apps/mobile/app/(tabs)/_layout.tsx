import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppSettings } from '../../src/features/settings/hooks/useAppSettings';
import type { ThemePalette } from '../../src/features/settings/hooks/useAppSettings';

function TabIcon({
  focused,
  color,
  icon,
  theme,
}: {
  focused: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: ThemePalette;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: theme.accentMuted }]}>
      <Ionicons name={icon} size={25} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useAppSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.divider,
          },
        ],
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} icon="home" theme={theme} />
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} icon="barbell" theme={theme} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} icon="stats-chart" theme={theme} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} icon="settings" theme={theme} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'relative',
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderRadius: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 46,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
