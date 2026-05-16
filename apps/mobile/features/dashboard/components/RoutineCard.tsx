import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardRoutine } from '../types/dashboard.types';

const UI = {
  card: '#222222',
  border: '#3A3A3A',
  text: '#FFFFFF',
  muted: '#8E8E93',
};

type Props = {
  routine: DashboardRoutine;
  onPress: (routineId: string) => void;
};

function formatMuscles(muscleGroups: string[]): string {
  if (muscleGroups.length === 0) return 'Custom routine';
  if (muscleGroups.length <= 2) return muscleGroups.join(' • ');
  return `${muscleGroups.slice(0, 2).join(' • ')}\n${muscleGroups.slice(2).join(' • ')}`;
}

export default function RoutineCard({ routine, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={() => onPress(routine.id)}>
      {routine.iconUrl ? (
        <Image source={{ uri: routine.iconUrl }} style={styles.iconImage} resizeMode="cover" />
      ) : (
        <View style={styles.iconFallback} />
      )}

      <Text style={styles.name} numberOfLines={1}>{routine.name}</Text>
      <Text style={styles.muscles} numberOfLines={2}>{formatMuscles(routine.muscleGroups)}</Text>
      <View style={styles.divider} />
      <Text style={styles.dateLabel}>Last used</Text>
      <Text style={styles.date}>{routine.lastUsedLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 150,
    paddingHorizontal: 13,
    paddingVertical: 14,
    width: 82,
  },
  iconFallback: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    height: 48,
    marginBottom: 11,
    width: 48,
  },
  iconImage: {
    borderRadius: 24,
    height: 48,
    marginBottom: 11,
    width: 48,
  },
  name: {
    color: UI.text,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
    textAlign: 'center',
    width: '100%',
  },
  muscles: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '600',
    lineHeight: 12,
    marginBottom: 11,
    minHeight: 24,
    textAlign: 'center',
  },
  divider: {
    backgroundColor: UI.border,
    height: 1,
    marginBottom: 7,
    width: '100%',
  },
  dateLabel: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    color: UI.text,
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
});
