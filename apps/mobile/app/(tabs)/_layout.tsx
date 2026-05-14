import { Tabs } from 'expo-router';

import {
  View,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../shared/theme';

function TabIcon({
  focused,
  color,
  icon,
}: {
  focused: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        focused && styles.iconWrapFocused,
      ]}
    >
      <Ionicons
        name={icon}
        size={24}
        color={color}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarStyle: {
          position: 'absolute',

          left: 16,
          right: 16,
          bottom: 18,

          height: 82,

          paddingTop: 10,
          paddingBottom: 10,

          borderRadius: 28,

          backgroundColor: COLORS.surface,

          borderTopWidth: 1,
          borderTopColor: COLORS.border,

          elevation: 0,
        },

        tabBarActiveTintColor: COLORS.accent,

        tabBarInactiveTintColor:
          COLORS.textSecondary,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',

          letterSpacing: 0.8,

          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="library"
        options={{
          title: 'LIBRARY',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="barbell"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: 'ANALYTICS',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="stats-chart"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',

          tabBarIcon: ({
            color,
            focused,
          }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon="settings"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    padding: 8,

    borderRadius: 14,

    marginTop: 4,
  },

  iconWrapFocused: {
    backgroundColor:
      COLORS.accent + '18',
  },
});