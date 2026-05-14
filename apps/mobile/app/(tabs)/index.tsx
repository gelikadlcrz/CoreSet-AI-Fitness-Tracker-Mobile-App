import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '../../shared/theme';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <Text style={styles.subtitle}>
        Workout summaries, AI recommendations, analytics, streaks, and active
        sessions will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,

    paddingTop: 80,
    paddingHorizontal: 24,
  },

  title: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 16,

    color: COLORS.textSecondary,

    fontSize: 18,
    lineHeight: 28,
  },
});