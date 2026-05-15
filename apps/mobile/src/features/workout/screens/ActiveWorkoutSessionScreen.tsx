import { useEffect, useState } from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../../../shared/theme';
import { pullExercises } from '../../../services/sync/pullExercises';
import { getOrCreateSettings } from '../../settings/services/settingsService';
import type { WeightUnit } from '../../settings/types/settings.types';

import {
  formatDuration,
  formatSetRest,
  getOrCreateActiveWorkoutSession,
} from '../services/workoutService';

import type {
  WorkoutExerciseVM,
  WorkoutSessionVM,
  WorkoutSetVM,
} from '../types/workoutSession.types';

const palette = COLORS as Record<string, string>;

const UI = {
  background: palette.background ?? '#0D0D0D',
  surface: palette.surface ?? '#1E1E1E',
  surfaceSecondary: palette.surfaceSecondary ?? '#2A2A2A',
  text: palette.text ?? '#FFFFFF',
  textMuted: palette.textMuted ?? '#8E8E8E',
  textSecondary: palette.textSecondary ?? '#B8B8B8',
  accent: palette.accent ?? '#E9FF21',
  border: palette.border ?? '#555555',
  input: palette.input ?? '#111111',
  iconOlive: palette.iconOlive ?? '#747900',
  warmup: palette.warmup ?? '#B36B00',
  failure: palette.failure ?? '#8B0000',
  dropset: palette.dropset ?? '#8A007A',
  inactive: palette.inactive ?? '#1D1D1D',
  success: palette.success ?? '#13C943',
  danger: palette.danger ?? '#FF4D2A',
};

function dateLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function setBadge(set: WorkoutSetVM) {
  if (set.type === 'warmup') return 'W';
  if (set.type === 'failure') return 'F';
  if (set.type === 'drop') return 'D';
  return String(set.order);
}

function badgeStyle(type: string) {
  if (type === 'warmup') return styles.badgeWarmup;
  if (type === 'failure') return styles.badgeFailure;
  if (type === 'drop') return styles.badgeDrop;
  return undefined;
}

function formatWeight(weightKg?: number, unit: WeightUnit = 'kg') {
  if (weightKg === undefined || weightKg === null || weightKg === 0) return '-';

  if (unit === 'lbs') {
    return String(Math.round(weightKg * 2.20462));
  }

  return String(weightKg);
}

function valueOrDash(value?: number) {
  if (value === undefined || value === null || value === 0) return '-';
  return String(value);
}

function previousLabel(set: WorkoutSetVM, unit: WeightUnit) {
  if (!set.previousWeightKg || !set.previousReps) return '-';

  const weight = formatWeight(set.previousWeightKg, unit);
  const suffix = set.type === 'warmup' ? ' (W)' : '';
  return `${weight} ${unit} x ${set.previousReps}${suffix}`;
}

function ExercisePanel({
  exercise,
  weightUnit,
}: {
  exercise: WorkoutExerciseVM;
  weightUnit: WeightUnit;
}) {
  const restSeconds = exercise.sets[0]?.restSeconds || 180;

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitle} numberOfLines={1}>
          {exercise.name}
        </Text>

        <View style={styles.exerciseActions}>
          <TouchableOpacity style={styles.smallIconButton}>
            <Ionicons name="analytics" size={14} color={UI.accent} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallIconButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color={UI.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setCard}>
        {!!exercise.note && (
          <Text style={styles.note} numberOfLines={1}>
            Note: {exercise.note}
          </Text>
        )}

        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.setColumn]}>Set</Text>
          <Text style={[styles.headerText, styles.previousColumn]}>Previous</Text>
          <Text style={[styles.headerText, styles.numericColumn]}>{weightUnit}</Text>
          <Text style={[styles.headerText, styles.numericColumn]}>Reps</Text>
          <Text style={[styles.headerText, styles.numericColumn]}>RPE</Text>
          <View style={styles.checkColumn} />
        </View>

        {exercise.sets.map(set => (
          <View key={set.id} style={styles.setRowWrap}>
            <View style={styles.setRow}>
              <View style={[styles.setBadge, badgeStyle(set.type)]}>
                <Text style={styles.setBadgeText}>{setBadge(set)}</Text>
              </View>

              <Text style={[styles.setText, styles.previousColumn]} numberOfLines={2}>
                {previousLabel(set, weightUnit)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn]} numberOfLines={1}>
                {formatWeight(set.weightKg, weightUnit)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn]} numberOfLines={1}>
                {valueOrDash(set.reps)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn]} numberOfLines={1}>
                {valueOrDash(set.rpe)}
              </Text>

              <View style={[styles.checkPill, set.completed && styles.checkPillDone]}>
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={set.completed ? '#FFFFFF' : UI.textMuted}
                />
              </View>
            </View>

            <View style={styles.restLineRow}>
              <View style={styles.restLine} />
              <Text style={styles.restText}>{formatSetRest(set.restSeconds)}</Text>
              <View style={styles.restLine} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addSetButton}>
          <Text style={styles.addSetText}>+ Add Set ({formatSetRest(restSeconds)})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ActiveWorkoutSessionScreen() {
  const [session, setSession] = useState<WorkoutSessionVM | null>(null);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await pullExercises();
      } catch (error) {
        console.log('Exercise sync skipped', error);
      }

      try {
        const [settings, activeSession] = await Promise.all([
          getOrCreateSettings(),
          getOrCreateActiveWorkoutSession(),
        ]);

        if (mounted) {
          setWeightUnit(settings.preferences.weightUnit);
          setSession(activeSession);
        }
      } catch (error) {
        console.log('Workout session load error', error);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (!session) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.loading}>Loading workout...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenLabel}>Active Workout Session</Text>

      <View style={styles.sessionCard}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color={UI.text} />
          </TouchableOpacity>

          <Text style={styles.sessionTitle} numberOfLines={1}>
            Workout Session
          </Text>

          <TouchableOpacity style={styles.finishButton}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.routineName} numberOfLines={1}>
          {session.routineName}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={15} color={UI.textSecondary} />
          <Text style={styles.metaText}>{dateLabel(session.startedAt)}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={UI.textSecondary} />
          <Text style={styles.metaText}>{formatDuration(session.elapsedSeconds)}</Text>
        </View>

        {session.exercises.map(exercise => (
          <ExercisePanel key={exercise.id} exercise={exercise} weightUnit={weightUnit} />
        ))}

        <TouchableOpacity style={styles.addExerciseButton}>
          <Text style={styles.addExerciseText}>Add Exercises</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel Workout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: UI.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: UI.textMuted,
    fontSize: 16,
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 12,
    paddingBottom: 112,
  },
  screenLabel: {
    color: UI.textMuted,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  sessionCard: {
    backgroundColor: UI.surface,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: UI.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sessionTitle: {
    flex: 1,
    color: UI.text,
    fontSize: 22,
    fontWeight: '800',
  },
  finishButton: {
    backgroundColor: UI.accent,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    marginLeft: 8,
  },
  finishText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  routineName: {
    color: UI.text,
    fontSize: 25,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    color: UI.textSecondary,
    marginLeft: 6,
    fontSize: 14,
  },
  exerciseBlock: {
    marginTop: 26,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    flex: 1,
    color: UI.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  exerciseActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  smallIconButton: {
    backgroundColor: UI.iconOlive,
    borderRadius: 999,
    minWidth: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  setCard: {
    backgroundColor: UI.surfaceSecondary,
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  note: {
    color: UI.textMuted,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: UI.border,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
    color: UI.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  setColumn: {
    width: 38,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1,
    minWidth: 58,
    paddingHorizontal: 3,
    textAlign: 'left',
  },
  numericColumn: {
    width: 42,
    textAlign: 'center',
  },
  checkColumn: {
    width: 30,
  },
  setRowWrap: {
    paddingHorizontal: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
  },
  setBadge: {
    width: 38,
    height: 30,
    borderRadius: 15,
    backgroundColor: UI.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWarmup: {
    backgroundColor: UI.warmup,
  },
  badgeFailure: {
    backgroundColor: UI.failure,
  },
  badgeDrop: {
    backgroundColor: UI.dropset,
  },
  setBadgeText: {
    color: UI.text,
    fontWeight: '900',
    fontSize: 14,
  },
  setText: {
    color: UI.text,
    fontSize: 14,
  },
  inputPill: {
    color: UI.text,
    backgroundColor: UI.input,
    borderRadius: 999,
    overflow: 'hidden',
    paddingVertical: 6,
    marginHorizontal: 2,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkPill: {
    width: 30,
    height: 26,
    marginLeft: 2,
    borderRadius: 13,
    backgroundColor: UI.inactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPillDone: {
    backgroundColor: UI.success,
  },
  restLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  restLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: UI.accent,
  },
  restText: {
    color: UI.accent,
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  addSetButton: {
    marginTop: 8,
    marginHorizontal: 8,
    backgroundColor: UI.input,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSetText: {
    color: UI.text,
    fontSize: 15,
  },
  addExerciseButton: {
    marginTop: 22,
    backgroundColor: UI.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addExerciseText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
  },
  cancelButton: {
    marginTop: 14,
    backgroundColor: UI.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
