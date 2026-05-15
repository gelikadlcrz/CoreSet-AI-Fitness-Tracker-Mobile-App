import { ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import ExerciseCard from '../components/ExerciseCard';
import WorkoutButton from '../components/WorkoutButton';
import { useActiveWorkout } from '../hooks/useActiveWorkout';

import { COLORS } from '../../../../shared/theme';
import { SPACING } from '../../../../shared/theme/spacing';

function formatDate(value?: number) {
  if (!value) return 'May 6, 2026';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDuration(startedAt?: number) {
  if (!startedAt) return '1:15:41';
  const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { workout, loading, addSet, finish } = useActiveWorkout();

  if (loading || !workout) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={COLORS.accent} />
        <Text style={styles.loadingText}>Preparing workout...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.sessionLabel}>Active Workout Session</Text>

      <View style={styles.panel}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </Pressable>

          <Text style={styles.panelTitle}>Workout Session</Text>

          <Pressable style={styles.finishButton} onPress={finish}>
            <Text style={styles.finishText}>Finish</Text>
          </Pressable>
        </View>

        <Text style={styles.workoutTitle}>{workout.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatDate(workout.startedAt)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{formatDuration(workout.startedAt)}</Text>
        </View>

        <View style={styles.exerciseList}>
          {workout.exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              title={exercise.name}
              note={exercise.note}
              sets={exercise.sets}
              onAddSet={() => addSet(exercise.id)}
            />
          ))}
        </View>

        <WorkoutButton title="Add Exercises" style={styles.addExerciseButton} />
        <WorkoutButton title="Cancel Workout" variant="danger" style={styles.cancelButton} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.screenHorizontal,
    paddingTop: 28,
    paddingBottom: 40,
  },
  sessionLabel: {
    color: COLORS.textMuted,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  panel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelTitle: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '700',
  },
  finishButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  finishText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '800',
  },
  workoutTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '500',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontSize: 14,
  },
  exerciseList: {
    marginTop: 10,
  },
  addExerciseButton: {
    marginTop: 4,
    height: 42,
    borderRadius: 12,
  },
  cancelButton: {
    marginTop: 14,
    height: 42,
    borderRadius: 12,
  },
});
