import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import { useRouter } from 'expo-router';

import { COLORS } from '../../shared/theme';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>
          CoreSet
        </Text>

        <Text style={styles.subtitle}>
          Edge AI Fitness Tracker
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() =>
          router.push('/capture')
        }
      >
        <Text style={styles.buttonText}>
          START WORKOUT
        </Text>
      </Pressable>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>
          Dashboard
        </Text>

        <Text style={styles.description}>
          Workout summaries, AI
          recommendations, analytics,
          streaks, and active sessions
          will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor:
      COLORS.background,

    justifyContent: 'center',

    paddingHorizontal: 24,
  },

  title: {
    color: COLORS.text,

    fontSize: 52,
    fontWeight: '900',

    letterSpacing: 1.5,
  },

  subtitle: {
    marginTop: 10,

    color: COLORS.textMuted,

    fontSize: 18,

    letterSpacing: 1,
  },

  button: {
    marginTop: 42,

    backgroundColor:
      COLORS.accent,

    paddingVertical: 20,

    borderRadius: 20,

    alignItems: 'center',
  },

  buttonText: {
    color: '#000',

    fontSize: 18,
    fontWeight: '900',

    letterSpacing: 2,
  },

  infoSection: {
    marginTop: 64,
  },

  sectionTitle: {
    color: COLORS.text,

    fontSize: 24,
    fontWeight: '800',
  },

  description: {
    marginTop: 12,

    color: COLORS.textSecondary,

    fontSize: 16,
    lineHeight: 28,
  },
});