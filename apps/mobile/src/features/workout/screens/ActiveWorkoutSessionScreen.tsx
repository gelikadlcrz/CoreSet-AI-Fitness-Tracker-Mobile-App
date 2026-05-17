import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
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
import { useRouter } from 'expo-router';

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
  replaceExerciseInActiveWorkout,
  toggleSetCompleted,
  updateRoutineExerciseFocusMetric,
  updateRoutineExerciseNote,
  updateRoutineExerciseRestTimer,
} from '../services/workoutService';

import type {
  ExercisePickerItem,
  FocusMetric,
  WorkoutExerciseVM,
  WorkoutSessionVM,
  WorkoutSetVM,
} from '../types/workoutSession.types';

const REST_OPTIONS = [60, 90, 120, 150, 180, 210, 240, 300];

function isLightTheme(theme: ThemePalette) {
  return theme.background.toLowerCase() !== '#181818' && theme.background.toLowerCase() !== '#0d0d0d';
}

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

function weightNumber(weightKg?: number, unit: WeightUnit = 'kg') {
  if (!weightKg) return 0;
  return unit === 'lbs' ? weightKg * 2.20462 : weightKg;
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

function focusMetricLabel(metric: FocusMetric, unit: WeightUnit) {
  switch (metric) {
    case 'total_volume':
      return 'Volume';
    case 'volume_increase':
      return 'Δ Vol';
    case 'total_reps':
      return 'Reps';
    case 'weight_per_rep':
      return `${unit}/Rep`;
    case 'reps_per_set':
      return 'Reps/Set';
    case 'previous':
    default:
      return 'Previous';
  }
}

function focusMetricValue(set: WorkoutSetVM, metric: FocusMetric, unit: WeightUnit) {
  const reps = set.reps || 0;
  const previousReps = set.previousReps || 0;
  const weight = weightNumber(set.weightKg, unit);
  const previousWeight = weightNumber(set.previousWeightKg, unit);

  switch (metric) {
    case 'total_volume': {
      if (!weight || !reps) return '-';
      return `${Math.round(weight * reps)} ${unit}`;
    }

    case 'volume_increase': {
      if (!weight || !reps || !previousWeight || !previousReps) return '-';
      const diff = Math.round(weight * reps - previousWeight * previousReps);
      return diff > 0 ? `+${diff}` : String(diff);
    }

    case 'total_reps':
      return reps ? String(reps) : '-';

    case 'weight_per_rep': {
      if (!weight || !reps) return '-';
      return `${(weight / reps).toFixed(1)}`;
    }

    case 'reps_per_set':
      return reps ? `${reps}/set` : '-';

    case 'previous':
    default:
      return previousLabel(set, unit);
  }
}

function badgeStyle(type: string, theme: ThemePalette) {
  if (type === 'warmup') return { backgroundColor: theme.warmup };
  if (type === 'failure') return { backgroundColor: theme.failure };
  if (type === 'drop') return { backgroundColor: theme.dropset };
  return { backgroundColor: theme.input };
}

function badgeTextColor(type: string, theme: ThemePalette) {
  if (!isLightTheme(theme)) return '#FFFFFF';
  if (type === 'warmup') return '#111111';
  if (type === 'failure' || type === 'drop') return '#FFFFFF';
  return theme.text;
}

function actionButtonColors(theme: ThemePalette) {
  if (isLightTheme(theme)) {
    return {
      backgroundColor: '#FFE3D1',
      color: '#FF5A00',
    };
  }

  return {
    backgroundColor: theme.accentMuted,
    color: theme.accent,
  };
}

function availableMetrics(isBodyweight: boolean): Array<{ key: FocusMetric; label: string; description: string }> {
  if (isBodyweight) {
    return [
      { key: 'previous', label: 'Previous', description: 'Show previous performance for each set.' },
      { key: 'total_reps', label: 'Total Reps', description: 'Show the reps completed for each set.' },
      { key: 'reps_per_set', label: 'Reps / Set', description: 'Show set-based rep targets for bodyweight movements.' },
    ];
  }

  return [
    { key: 'previous', label: 'Previous', description: 'Show previous weight and reps.' },
    { key: 'total_volume', label: 'Total Volume', description: 'Weight multiplied by reps for each set.' },
    { key: 'volume_increase', label: 'Volume Increase', description: 'Difference from the previous set volume.' },
    { key: 'total_reps', label: 'Total Reps', description: 'Show reps completed for each set.' },
    { key: 'weight_per_rep', label: 'Weight / Rep', description: 'Show load divided by reps.' },
  ];
}

function formatHistoryNumber(value?: number) {
  if (!value) return '0';
  return value >= 1000 ? value.toLocaleString() : String(Math.round(value));
}

function ExerciseImagePreview({ exercise, theme, large = false }: { exercise: ExercisePickerItem; theme: ThemePalette; large?: boolean }) {
  if (exercise.thumbnailUrl) {
    return (
      <Image
        source={{ uri: exercise.thumbnailUrl }}
        style={large ? styles.detailImage : styles.exerciseThumb}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        large ? styles.detailImage : styles.exerciseThumb,
        styles.exerciseThumbFallback,
        { backgroundColor: theme.surfaceTertiary },
      ]}
    >
      <Ionicons name={exercise.isBodyweight ? 'body-outline' : 'barbell'} size={large ? 42 : 20} color={theme.accent} />
    </View>
  );
}

function ExerciseDetailModal({
  exercise,
  theme,
  onClose,
  onSelect,
}: {
  exercise: ExercisePickerItem | null;
  theme: ThemePalette;
  onClose: () => void;
  onSelect: (exercise: ExercisePickerItem) => void;
}) {
  if (!exercise) return null;

  const history = exercise.history || { totalSets: 0, totalReps: 0, bestWeightKg: 0, totalVolumeKg: 0 };
  const muscles = [exercise.primaryMuscle, ...(exercise.secondaryMuscles || [])].filter(Boolean);
  const hasHistory = history.totalSets > 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.exerciseDetailCard, { backgroundColor: theme.surface }]}> 
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Exercise Preview</Text>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ExerciseImagePreview exercise={exercise} theme={theme} large />

            <Text style={[styles.detailName, { color: theme.text }]}>{exercise.name}</Text>
            <Text style={[styles.detailMeta, { color: theme.textMuted }]}>
              {[exercise.targetMuscle || exercise.primaryMuscle, exercise.bodyPart, exercise.equipmentType || exercise.equipment, exercise.movementPattern]
                .filter(Boolean)
                .join(' • ') || 'Exercise'}
            </Text>

            <View style={styles.detailChipRow}>
              {exercise.isAiTracked && (
                <View style={[styles.detailChip, { backgroundColor: actionButtonColors(theme).backgroundColor }]}> 
                  <Ionicons name="camera" size={13} color={actionButtonColors(theme).color} />
                  <Text style={[styles.detailChipText, { color: actionButtonColors(theme).color }]}>AI-tracked</Text>
                </View>
              )}

              <View style={[styles.detailChip, { backgroundColor: theme.surfaceSecondary }]}> 
                <Text style={[styles.detailChipText, { color: theme.text }]}>
                  {exercise.isBodyweight ? 'Bodyweight' : 'Weighted'}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}> 
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Description</Text>
              <Text style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                {exercise.description || exercise.notes || 'No exercise description has been provided by the API yet.'}
              </Text>
            </View>

            {!!exercise.instructions?.length && (
              <View style={styles.detailSection}> 
                <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Instructions</Text>
                {exercise.instructions.slice(0, 6).map((instruction, index) => (
                  <Text key={`${exercise.id}-instruction-${index}`} style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                    {index + 1}. {instruction}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.detailSection}> 
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Muscles and Equipment</Text>
              <Text style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                Muscles: {muscles.length ? muscles.join(', ') : 'Not specified'}
              </Text>
              {!!exercise.bodyPart && (
                <Text style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                  Body part: {exercise.bodyPart}
                </Text>
              )}
              <Text style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                Equipment: {exercise.equipmentType || exercise.equipment || 'Not specified'}
              </Text>
              {!!exercise.aiExerciseClass && (
                <Text style={[styles.detailBodyText, { color: theme.textSecondary }]}> 
                  AI class: {exercise.aiExerciseClass}
                </Text>
              )}
            </View>

            <View style={styles.detailSection}> 
              <Text style={[styles.detailSectionTitle, { color: theme.text }]}>Local History</Text>
              <View style={styles.historyGrid}>
                <View style={[styles.historyCard, { backgroundColor: theme.surfaceSecondary }]}> 
                  <Text style={[styles.historyValue, { color: theme.accent }]}>{formatHistoryNumber(history.totalSets)}</Text>
                  <Text style={[styles.historyLabel, { color: theme.textMuted }]}>Sets</Text>
                </View>
                <View style={[styles.historyCard, { backgroundColor: theme.surfaceSecondary }]}> 
                  <Text style={[styles.historyValue, { color: theme.accent }]}>{formatHistoryNumber(history.totalReps)}</Text>
                  <Text style={[styles.historyLabel, { color: theme.textMuted }]}>Reps</Text>
                </View>
                <View style={[styles.historyCard, { backgroundColor: theme.surfaceSecondary }]}> 
                  <Text style={[styles.historyValue, { color: theme.accent }]}>{formatHistoryNumber(history.bestWeightKg)}</Text>
                  <Text style={[styles.historyLabel, { color: theme.textMuted }]}>Best kg</Text>
                </View>
              </View>

              <View style={[styles.chartShell, { backgroundColor: theme.surfaceSecondary }]}> 
                {[0.45, 0.72, 0.56, 0.82, hasHistory ? 0.95 : 0.35].map((heightRatio, index) => (
                  <View key={index} style={styles.chartBarWrap}> 
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${heightRatio * 100}%`,
                          backgroundColor: theme.accent,
                          opacity: hasHistory ? 1 : 0.28,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <Text style={[styles.detailHint, { color: theme.textMuted }]}> 
                {hasHistory ? 'Based on local completed workout sets.' : 'Charts will become meaningful after completed workout history exists.'}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.detailAddButton, { backgroundColor: theme.accent }]} onPress={() => onSelect(exercise)}>
            <Text style={styles.detailAddText}>Add Exercise</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ExercisePickerModal({
  visible,
  exercises,
  theme,
  title,
  onClose,
  onSelect,
}: {
  visible: boolean;
  exercises: ExercisePickerItem[];
  theme: ThemePalette;
  title: string;
  onClose: () => void;
  onSelect: (exercise: ExercisePickerItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [previewExercise, setPreviewExercise] = useState<ExercisePickerItem | null>(null);

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
            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
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
                onLongPress={() => setPreviewExercise(exercise)}
                delayLongPress={350}
                activeOpacity={0.86}
              >
                <ExerciseImagePreview exercise={exercise} theme={theme} />

                <View style={styles.exercisePickerTextWrap}>
                  <Text style={[styles.exercisePickerName, { color: theme.text }]} numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exercisePickerMeta, { color: theme.textMuted }]} numberOfLines={2}>
                    {[exercise.targetMuscle || exercise.primaryMuscle, exercise.equipmentType || exercise.equipment, exercise.isAiTracked ? 'AI-tracked' : 'Manual']
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>

                {exercise.isAiTracked && (
                  <View style={[styles.aiTag, { backgroundColor: actionButtonColors(theme).backgroundColor }]}>
                    <Ionicons name="camera" size={13} color={actionButtonColors(theme).color} />
                  </View>
                )}

                <Ionicons name="add-circle" size={24} color={theme.accent} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.longPressHint, { color: theme.textMuted }]}>Long press an exercise to preview details.</Text>

          <ExerciseDetailModal
            exercise={previewExercise}
            theme={theme}
            onClose={() => setPreviewExercise(null)}
            onSelect={exercise => {
              setPreviewExercise(null);
              onSelect(exercise);
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AnalyticsMetricModal({
  visible,
  exercise,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  exercise: WorkoutExerciseVM;
  theme: ThemePalette;
  onClose: () => void;
  onSelect: (metric: FocusMetric) => void;
}) {
  const metrics = availableMetrics(exercise.isBodyweight);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Focus Metric</Text>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {metrics.map(metric => {
            const selected = metric.key === exercise.focusMetric;

            return (
              <TouchableOpacity
                key={metric.key}
                style={[
                  styles.metricOption,
                  {
                    backgroundColor: selected ? theme.accentMuted : theme.surfaceSecondary,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => onSelect(metric.key)}
              >
                <View style={styles.metricOptionTextWrap}>
                  <Text style={[styles.metricOptionTitle, { color: selected ? theme.accent : theme.text }]}>
                    {metric.label}
                  </Text>
                  <Text style={[styles.metricOptionDescription, { color: theme.textMuted }]}>
                    {metric.description}
                  </Text>
                </View>

                {selected && <Ionicons name="checkmark-circle" size={22} color={theme.accent} />}
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RestTimerModal({
  visible,
  theme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onSelect: (seconds: number) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update Rest Timer</Text>
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.restChoiceGrid}>
            {REST_OPTIONS.map(seconds => (
              <TouchableOpacity
                key={seconds}
                style={[styles.restChoice, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                onPress={() => onSelect(seconds)}
              >
                <Text style={[styles.restChoiceText, { color: theme.text }]}>
                  {formatSetRest(seconds)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  onReplaceRequest,
}: {
  exercise: WorkoutExerciseVM;
  sessionId: string;
  weightUnit: WeightUnit;
  theme: ThemePalette;
  onRefresh: () => Promise<void>;
  onReplaceRequest: (exercise: WorkoutExerciseVM) => void;
}) {
  const router = useRouter();
  const [noteDraft, setNoteDraft] = useState(exercise.note || '');
  const [editVisible, setEditVisible] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [restVisible, setRestVisible] = useState(false);
  const actionColors = actionButtonColors(theme);
  const restSeconds = exercise.sets[0]?.restSeconds || 180;

  const handleToggleSet = async (setId: string) => {
    await toggleSetCompleted(setId);
    await onRefresh();
  };

  const handleAddSet = () => {
    Alert.alert('Add Set', 'Choose the set type to add.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Warm-up Set',
        onPress: async () => {
          await addSetToRoutineExercise(sessionId, exercise.routineExerciseId, 'warmup');
          await onRefresh();
        },
      },
      {
        text: 'Working Set',
        onPress: async () => {
          await addSetToRoutineExercise(sessionId, exercise.routineExerciseId, 'normal');
          await onRefresh();
        },
      },
      {
        text: 'Failure Set',
        onPress: async () => {
          await addSetToRoutineExercise(sessionId, exercise.routineExerciseId, 'failure');
          await onRefresh();
        },
      },
      {
        text: 'Drop Set',
        onPress: async () => {
          await addSetToRoutineExercise(sessionId, exercise.routineExerciseId, 'drop');
          await onRefresh();
        },
      },
    ]);
  };

  const handleRemoveExercise = () => {
    setEditVisible(false);

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
    setNoteVisible(false);
    await onRefresh();
  };

  const handleSelectMetric = async (metric: FocusMetric) => {
    await updateRoutineExerciseFocusMetric(exercise.routineExerciseId, metric);
    setAnalyticsVisible(false);
    await onRefresh();
  };

  const handleSelectRest = async (seconds: number) => {
    await updateRoutineExerciseRestTimer(sessionId, exercise.routineExerciseId, seconds);
    setRestVisible(false);
    await onRefresh();
  };

  const openCapture = () => {
    router.push('/capture');
  };

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <Text style={[styles.exerciseTitle, { color: theme.accent }]} numberOfLines={1}>
          {exercise.name}
        </Text>

        <View style={styles.exerciseActions}>
          {exercise.isAiTracked && (
            <TouchableOpacity
              style={[styles.cameraIconButton, { backgroundColor: isLightTheme(theme) ? '#FF5A00' : '#9B4B2E' }]}
              onPress={openCapture}
              activeOpacity={0.86}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.smallIconButton, { backgroundColor: actionColors.backgroundColor }]}
            onPress={() => setAnalyticsVisible(true)}
            activeOpacity={0.86}
          >
            <Ionicons name="analytics" size={14} color={actionColors.color} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallIconButton, { backgroundColor: actionColors.backgroundColor }]}
            onPress={() => setEditVisible(true)}
            activeOpacity={0.86}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={actionColors.color} />
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
          <Text style={[styles.headerText, styles.previousColumn, { color: theme.text }]}>
            {focusMetricLabel(exercise.focusMetric, weightUnit)}
          </Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>{weightUnit}</Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>Reps</Text>
          <Text style={[styles.headerText, styles.numericColumn, { color: theme.text }]}>RPE</Text>
          <View style={styles.checkColumn} />
        </View>

        {exercise.sets.map(set => (
          <View key={set.id} style={styles.setRowWrap}>
            <View style={styles.setRow}>
              <View style={[styles.setBadge, badgeStyle(set.type, theme)]}>
                <Text style={[styles.setBadgeText, { color: badgeTextColor(set.type, theme) }]}>
                  {setBadge(set)}
                </Text>
              </View>

              <Text style={[styles.setText, styles.previousColumn, { color: theme.text }]} numberOfLines={2}>
                {focusMetricValue(set, exercise.focusMetric, weightUnit)}
              </Text>

              <Text
                style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]}
                numberOfLines={1}
              >
                {formatWeight(set.weightKg, weightUnit)}
              </Text>

              <Text
                style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]}
                numberOfLines={1}
              >
                {valueOrDash(set.reps)}
              </Text>

              <Text
                style={[styles.inputPill, styles.numericColumn, { backgroundColor: theme.input, color: theme.text }]}
                numberOfLines={1}
              >
                {valueOrDash(set.rpe)}
              </Text>

              <TouchableOpacity
                style={[
                  styles.checkPill,
                  { backgroundColor: set.completed ? theme.success : theme.inactive },
                ]}
                onPress={() => handleToggleSet(set.id)}
                activeOpacity={0.85}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
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
          <Text style={[styles.addSetText, { color: theme.text }]}>
            + Add Set ({formatSetRest(restSeconds)})
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={[styles.actionMenu, { backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setEditVisible(false);
                setNoteVisible(true);
              }}
            >
              <Ionicons name="document-text" size={18} color={theme.accent} />
              <Text style={[styles.actionMenuText, { color: theme.text }]}>Add Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setEditVisible(false);
                onReplaceRequest(exercise);
              }}
            >
              <Ionicons name="swap-horizontal" size={18} color={theme.accent} />
              <Text style={[styles.actionMenuText, { color: theme.text }]}>Replace Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setEditVisible(false);
                setRestVisible(true);
              }}
            >
              <Ionicons name="timer" size={18} color={theme.accent} />
              <Text style={[styles.actionMenuText, { color: theme.text }]}>Update Rest Timers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                setEditVisible(false);
                setAnalyticsVisible(true);
              }}
            >
              <Ionicons name="options" size={18} color={theme.accent} />
              <Text style={[styles.actionMenuText, { color: theme.text }]}>Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleRemoveExercise}>
              <Ionicons name="trash" size={18} color={theme.danger} />
              <Text style={[styles.actionMenuText, { color: theme.danger }]}>Remove Exercise</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={noteVisible} transparent animationType="fade" onRequestClose={() => setNoteVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setNoteVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Exercise Note</Text>
              <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]} onPress={() => setNoteVisible(false)}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

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
          </Pressable>
        </Pressable>
      </Modal>

      <AnalyticsMetricModal
        visible={analyticsVisible}
        exercise={exercise}
        theme={theme}
        onClose={() => setAnalyticsVisible(false)}
        onSelect={handleSelectMetric}
      />

      <RestTimerModal
        visible={restVisible}
        theme={theme}
        onClose={() => setRestVisible(false)}
        onSelect={handleSelectRest}
      />
    </View>
  );
}

export default function ActiveWorkoutSessionScreen() {
  const { settings, theme } = useAppSettings();
  const [session, setSession] = useState<WorkoutSessionVM | null>(null);
  const [availableExercises, setAvailableExercises] = useState<ExercisePickerItem[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<WorkoutExerciseVM | null>(null);

  const loadLocal = async () => {
    const [activeSession, exercises] = await Promise.all([
      getOrCreateActiveWorkoutSession(),
      listAvailableExercises(),
    ]);

    setSession(activeSession);
    setAvailableExercises(exercises);
  };

  const refreshFromApi = async () => {
    try {
      await pullExercises();
      const exercises = await listAvailableExercises();
      setAvailableExercises(exercises);
    } catch (error) {
      console.log('Exercise sync skipped', error);
    }
  };

  const load = async () => {
    await loadLocal();
    refreshFromApi();
  };

  useEffect(() => {
    load().catch(error => {
      console.log('Workout session load error', error);
    });
  }, []);

  const handleAddExercise = async (exercise: ExercisePickerItem) => {
    if (!session) return;

    if (replaceTarget) {
      await replaceExerciseInActiveWorkout(session.id, replaceTarget.routineExerciseId, exercise.id);
      setReplaceTarget(null);
      setPickerVisible(false);
      await load();
      return;
    }

    await addExerciseToActiveSession(session.id, session.routineId, exercise.id);
    setPickerVisible(false);
    await load();
  };

  const handleReplaceRequest = async (exercise: WorkoutExerciseVM) => {
    setReplaceTarget(exercise);
    setPickerVisible(true);
    await refreshFromApi();
  };

  const handleOpenAddExercise = async () => {
    setReplaceTarget(null);
    setPickerVisible(true);
    await refreshFromApi();
  };

  const handleFinish = () => {
    if (!session) return;

    Alert.alert('Finish workout?', 'This will save the current workout session.', [
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

    Alert.alert('Cancel workout?', 'This will cancel the current workout session.', [
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
              onReplaceRequest={handleReplaceRequest}
            />
          ))}

          <TouchableOpacity style={[styles.addExerciseButton, { backgroundColor: theme.accent }]} onPress={handleOpenAddExercise}>
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
        title={replaceTarget ? 'Replace Exercise' : 'Add Exercise'}
        onClose={() => {
          setPickerVisible(false);
          setReplaceTarget(null);
        }}
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
    paddingBottom: 12,
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
  cameraIconButton: {
    borderRadius: 12,
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
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
    fontWeight: '700',
    textAlign: 'center',
  },
  setColumn: {
    width: 38,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1,
    minWidth: 72,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionMenu: {
    width: '88%',
    maxWidth: 340,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  actionMenuItem: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionMenuText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '800',
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
  aiTag: {
    width: 28,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  exerciseThumb: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 10,
  },
  exerciseThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  longPressHint: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  exerciseDetailCard: {
    maxHeight: '88%',
    borderRadius: 24,
    padding: 18,
  },
  detailImage: {
    width: '100%',
    height: 170,
    borderRadius: 20,
    marginBottom: 14,
  },
  detailName: {
    fontSize: 23,
    fontWeight: '900',
  },
  detailMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  detailChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  detailChip: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 5,
  },
  detailSection: {
    marginTop: 16,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  detailBodyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  historyGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  historyCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  historyLabel: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  chartShell: {
    height: 88,
    borderRadius: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartBarWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  chartBar: {
    width: '100%',
    borderRadius: 999,
  },
  detailHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  detailAddButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  detailAddText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
  },
  metricOption: {
    minHeight: 66,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricOptionTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  metricOptionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  metricOptionDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  restChoiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  restChoice: {
    width: '31%',
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  restChoiceText: {
    fontSize: 15,
    fontWeight: '900',
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
});
