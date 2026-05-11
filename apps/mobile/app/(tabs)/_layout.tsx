import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';

const ACCENT = '#00E5FF';
const INACTIVE = '#FFFFFF44';
const BG = '#0A0A0F';

function TabIcon({ focused, color, size, children }: any) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: ACCENT + '22' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: '#FFFFFF11',
          height: 64,
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1,
          marginBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'DASHBOARD' }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'LIBRARY' }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'ANALYTICS' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'SETTINGS' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { padding: 6, borderRadius: 8, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});