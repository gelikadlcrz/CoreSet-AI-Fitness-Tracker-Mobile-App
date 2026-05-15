import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { pullExercises } from '../../../services/sync/pullExercises';
import { useAppSettings } from '../../settings/hooks/useAppSettings';
import type { ThemePalette } from '../../settings/hooks/useAppSettings';
import type { WeightUnit } from '../../settings/types/settings.types';

import {
  addExerciseToActiveSession,
  addSetToRoutineExercise,
  cancelActiveWorkout,
  finishActiveWorkout,
  formatDuration,
  formatSetRest,
  getOrCreateActiveWorkoutSession,
  listAvailableExercises,
  removeExerciseFromActiveWorkout,
  toggleSetCompleted,
  updateRoutineExerciseNote,
} from '../services/workoutService';

import type {
  ExercisePickerItem,
  WorkoutExerciseVM,
  WorkoutSessionVM,
  WorkoutSetVM,
} from '../types/workoutSession.types';

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

function badgeStyle(type: string, theme: ThemePalette) {
  if (type === 'warmup') return { backgroundColor: theme.warmup };
  if (type === 'failure') return { backgroundColor: theme.failure };
  if (type === 'drop') return { backgroundColor: theme.dropset };
  return undefined;
}

function ExercisePickerModal({
  visible,
  exercises,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  exercises: ExercisePickerItem[];
  theme: ThemePalette;
  onClose: () => void;
  onSelect: (exercise: ExercisePickerItem) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;

    return exercises.filter(exercise =>
      `${exercise.name} ${exercise.equipment || ''} ${exercise.primaryMuscle || ''}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [exercises, query]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]}> 
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Exercise</Text>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.exerciseSearch,
              {
                backgroundColor: theme.input,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />

          <ScrollView style={styles.exercisePickerList} showsVerticalScrollIndicator={false}>
            {filtered.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exercisePickerItem, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => onSelect(exercise)}
              >
                <View style={styles.exercisePickerTextWrap}>
                  <Text style={[styles.exercisePickerName, { color: theme.text }]} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exercisePickerMeta, { color: theme.textMuted }]} numberOfLines={1}>
                    {[exercise.primaryMuscle, exercise.equipment, exercise.isAiTracked ? 'AI-tracked' : 'Manual']
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ExercisePanel({
  exercise,
  sessionId,
  weightUnit,
  theme,
  onRefresh,
}: {
  exercise: WorkoutExerciseVM;
  sessionId: string;
  weightUnit: WeightUnit;
  theme: ThemePalette;
  onRefresh: () => Promise<void>;
}) {
  const [noteDraft, setNoteDraft] = useState(exercise.note || '');
  const [editVisible, setEditVisible] = useState(false);
  const restSeconds = exercise.sets[0]?.restSeconds || 180;

  const handleToggleSet = async (setId: string) => {
    await toggleSetCompleted(setId);
    await onRefresh();
  };

  const handleAddSet = async () => {
    await addSetToRoutineExercise(sessionId, exercise.routineExerciseId);
    await onRefresh();
  };

  const handleRemoveExercise = () => {
    Alert.alert('Remove exercise?', `Remove ${exercise.name} from this workout?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeExerciseFromActiveWorkout(sessionId, exercise.routineExerciseId);
          await onRefresh();
        },
      },
    ]);
  };

  const handleSaveNote = async () => {
    await updateRoutineExerciseNote(exercise.routineExerciseId, noteDraft.trim());
    setEditVisible(false);
    await onRefresh();
  };

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseTitle, { color: theme.accent }]} numberOfLines={1}>
          {exercise.name}
        </Text>

        <View style={styles.exerciseActions}>
          <TouchableOpacity style={[styles.smallIconButton, { backgroundColor: theme.iconOlive }]}> 
            <Ionicons name="analytics" size={14} color={theme.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallIconButton, { backgroundColor: theme.iconOlive }]}
            onPress={() => setEditVisible(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={theme.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.setCard, { backgroundColor: theme.surfaceSecondary }]}> 
        {!!exercise.note && (
          <Text style={[styles.note, { color: theme.textMuted }]} numberOfLines={1}>
            Note: {exercise.note}
          </Text>
        )}

        <View style={[styles.tableHeader, { borderTopColor: theme.border }]}> 
          <Text style={[styles.headerText, styles.setColumn, { color: theme.text }]}>Set</Text>
          <Text style={[styles.headerText, styles.previousColumn, { color: theme.text }]}>Previous</Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>{weightUnit}</Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>Reps</Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>RPE</Text>
          <View style={styles.checkColumn} />
        </View>

        {exercise.sets.map(set => (
          <View key={set.id} style={styles.setRowWrap}>
            <View style={styles.setRow}>
              <View style={[styles.setBadge, { backgroundColor: theme.input }, badgeStyle(set.type, theme)]}>
                <Text style={[styles.setBadgeText, { color: theme.text }]}>{setBadge(set)}</Text>
              </View>

              <Text style={[styles.setText, styles.previousColumn, { color: theme.text }]} numberOfLines={2}>
                {previousLabel(set, weightUnit)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]} numberOfLines={1}>
                {formatWeight(set.weightKg, weightUnit)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]} numberOfLines={1}>
                {valueOrDash(set.reps)}
              </Text>

              <Text style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]} numberOfLines={1}>
                {valueOrDash(set.rpe)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.checkPill,
                  { backgroundColor: theme.inactive },
                  set.completed && { backgroundColor: theme.success },
                ]}
                onPress={() => handleToggleSet(set.id)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={set.completed ? '#FFFFFF' : theme.textMuted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.restLineRow}>
              <View style={[styles.restLine, { backgroundColor: theme.accent }]} />
              <Text style={[styles.restText, { color: theme.accent }]}>
                {formatSetRest(set.restSeconds)}
              </Text>
              <View style={[styles.restLine, { backgroundColor: theme.accent }]} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.addSetButton, { backgroundColor: theme.input }]} onPress={handleAddSet}>
          <Text style={[styles.addSetText, { color: theme.text }]}>+ Add Set ({formatSetRest(restSeconds)})</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Exercise</Text>
              <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={() => setEditVisible(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.editLabel, { color: theme.textMuted }]}>Exercise note</Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Add note"
              placeholderTextColor={theme.textMuted}
              style={[
                styles.editInput,
                {
                  backgroundColor: theme.input,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
            />

            <TouchableOpacity style={[styles.editAction, { backgroundColor: theme.accent }]} onPress={handleSaveNote}>
              <Text style={styles.editActionText}>Save Note</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.editAction, { backgroundColor: theme.input }]} onPress={handleAddSet}>
              <Text style={[styles.editSecondaryText, { color: theme.text }]}>Add Set</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.editAction, { backgroundColor: theme.danger }]} onPress={handleRemoveExercise}>
              <Text style={styles.editDangerText}>Remove Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function ActiveWorkoutSessionScreen() {
  const { settings, theme } = useAppSettings();
  const [session, setSession] = useState<WorkoutSessionVM | null>(null);
  const [availableExercises, setAvailableExercises] = useState<ExercisePickerItem[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const load = async () => {
    try {
      await pullExercises();
    } catch (error) {
      console.log('Exercise sync skipped', error);
    }

    const [activeSession, exercises] = await Promise.all([
      getOrCreateActiveWorkoutSession(),
      listAvailableExercises(),
    ]);

    setSession(activeSession);
    setAvailableExercises(exercises);
  };

  useEffect(() => {
    load().catch(error => {
      console.log('Workout session load error', error);
    });
  }, []);

  const handleAddExercise = async (exercise: ExercisePickerItem) => {
    if (!session) return;

    await addExerciseToActiveSession(session.id, session.routineId, exercise.id);
    setPickerVisible(false);
    await load();
  };

  const handleFinish = () => {
    if (!session) return;

    Alert.alert('Finish workout?', 'This will complete the active workout session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await finishActiveWorkout(session.id);
          await load();
        },
      },
    ]);
  };

  const handleCancel = () => {
    if (!session) return;

    Alert.alert('Cancel workout?', 'This will remove the current active workout session locally.', [
      { text: 'Keep Workout', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: async () => {
          await cancelActiveWorkout(session.id);
          await load();
        },
      },
    ]);
  };

  if (!session) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: theme.background }]}> 
        <Text style={[styles.loading, { color: theme.textMuted }]}>Loading workout...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenLabel, { color: theme.textMuted }]}>Active Workout Session</Text>

        <View style={[styles.sessionCard, { backgroundColor: theme.surface }]}> 
          <View style={styles.topRow}>
            <TouchableOpacity style={[styles.backCircle, { backgroundColor: theme.surfaceSecondary }]}> 
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.sessionTitle, { color: theme.text }]} numberOfLines={1}>
              Workout Session
            </Text>

            <TouchableOpacity style={[styles.finishButton, { backgroundColor: theme.accent }]} onPress={handleFinish}>
              <Text style={styles.finishText}>Finish</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.routineName, { color: theme.text }]} numberOfLines={1}>
            {session.routineName}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={15} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{dateLabel(session.startedAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}> 
              {formatDuration(session.elapsedSeconds)}
            </Text>
          </View>

          {session.exercises.map(exercise => (
            <ExercisePanel
              key={exercise.id}
              exercise={exercise}
              sessionId={session.id}
              weightUnit={settings.preferences.weightUnit}
              theme={theme}
              onRefresh={load}
            />
          ))}

          <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: theme.accent }]} onPress={() => setPickerVisible(true)}>
            <Text style={styles.addExerciseText}>Add Exercises</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.danger }]} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel Workout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerVisible}
        exercises={availableExercises}
        theme={theme}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    fontSize: 16,
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 12,
    paddingBottom: 104,
  },
  screenLabel: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  sessionCard: {
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sessionTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  finishButton: {
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
    fontSize: 25,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
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
    fontSize: 20,
    fontWeight: '800',
  },
  exerciseActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  smallIconButton: {
    borderRadius: 999,
    minWidth: 32,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  setCard: {
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 12,
  },
  note: {
    fontSize: 15,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerText: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeText: {
    fontWeight: '900',
    fontSize: 14,
  },
  setText: {
    fontSize: 14,
  },
  inputPill: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  restLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  restLine: {
    flex: 1,
    height: 1.5,
  },
  restText: {
    fontSize: 14,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  addSetButton: {
    marginTop: 8,
    marginHorizontal: 8,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSetText: {
    fontSize: 15,
  },
  addExerciseButton: {
    marginTop: 22,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    maxHeight: '78%',
    borderRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseSearch: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 12,
  },
  exercisePickerList: {
    maxHeight: 420,
  },
  exercisePickerItem: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exercisePickerTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  exercisePickerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  exercisePickerMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    marginBottom: 12,
  },
  editAction: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  editActionText: {
    color: '#000000',
    fontWeight: '900',
  },
  editSecondaryText: {
    fontWeight: '900',
  },
  editDangerText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
