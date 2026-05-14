import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ExerciseCard from '@/features/workout/components/ExerciseCard';
import WorkoutButton from '@/features/workout/components/WorkoutButton';

import { MOCK_WORKOUT } from '@/features/workout/mock/mockWorkout';

import { COLORS } from '@/shared/theme';
import { SPACING } from '@/shared/theme/spacing';

export default function WorkoutSessionScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.sessionLabel}>
          Active Workout Session
        </Text>

        <View style={styles.mainHeaderRow}>
          <Text style={styles.backButton}>‹</Text>

          <Text style={styles.title}>Upper Body Day</Text>

          <WorkoutButton
            title="Finish"
            small
            style={styles.finishButton}
          />
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#D0D0D0"
            />

            <Text style={styles.metaText}>
              May 6, 2026
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#D0D0D0"
            />

            <Text style={styles.metaText}>
              1:15:41
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color="#D0D0D0"
          />

          <Text style={styles.metaText}>
            1:15:41
          </Text>
        </View>
      </View>

      {MOCK_WORKOUT.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          title={exercise.name}
          note={exercise.note}
          sets={exercise.sets}
        />
      ))}

      <WorkoutButton
        title="Add Exercises"
        style={styles.addExerciseButton}
      />

      <WorkoutButton
        title="Cancel Workout"
        variant="danger"
        style={styles.cancelButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    mainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  metaContainer: {
    marginTop: 18,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingTop: 12,
    paddingBottom: 60,
  },

  header: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
    marginBottom: 18,
  },

  sessionLabel: {
    color: '#7C7C7C',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },

  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  backButton: {
    color: COLORS.text,
    fontSize: 34,
    lineHeight: 34,
    marginLeft: -2,
  },

  finishButton: {
    minWidth: 96,
    height: 52,
  },

  title: {
    flex: 1,
    marginHorizontal: 14,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  metaText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  addExerciseButton: {
    marginTop: 10,
  },

  cancelButton: {
    marginTop: 14,
    marginBottom: 24,
  },
});