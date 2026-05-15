import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../shared/theme';

type SetItem = {
  id: string;
  reps: number;
  weight: number;
  rpe: number;
  previous?: string;
  status?: 'normal' | 'warmup' | 'failure' | 'dropset';
  restSeconds?: number;
  isCompleted?: boolean;
};

type Props = {
  title: string;
  note?: string;
  sets: SetItem[];
  onAddSet?: () => void;
};

function formatRest(seconds = 180) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

function renderSetLabel(set: SetItem, fallback: number) {
  if (set.status === 'warmup') return 'W';
  if (set.status === 'failure') return 'F';
  if (set.status === 'dropset') return 'D';
  return String(fallback);
}

export default function ExerciseCard({
  title,
  note,
  sets,
  onAddSet,
}: Props) {
  const defaultRest = formatRest(sets[0]?.restSeconds ?? 180);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.iconsRow}>
          <View style={styles.iconOrange}>
            <Ionicons name="camera" size={18} color="#FFF6A8" />
          </View>

          <View style={styles.iconOlive}>
            <MaterialCommunityIcons name="chart-line" size={18} color={COLORS.accent} />
          </View>

          <View style={styles.iconOlive}>
            <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.accent} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {note ? (
          <>
            <Text style={styles.note}>{note}</Text>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={styles.labelRow}>
          <Text style={[styles.label, styles.setColumn]}>Set</Text>
          <Text style={[styles.label, styles.previousColumn]}>Previous</Text>
          <Text style={[styles.label, styles.metricColumn]}>kg</Text>
          <Text style={[styles.label, styles.metricColumn]}>Reps</Text>
          <Text style={[styles.label, styles.metricColumn]}>RPE</Text>
        </View>

        {sets.map((set, index) => (
          <View key={set.id}>
            <View style={styles.row}>
              <View
                style={[
                  styles.setBadge,
                  set.status === 'warmup' && styles.warmupBadge,
                  set.status === 'failure' && styles.failureBadge,
                  set.status === 'dropset' && styles.dropBadge,
                ]}
              >
                <Text style={styles.badgeText}>{renderSetLabel(set, index + 1)}</Text>
              </View>

              <Text style={styles.previous}>{set.previous ?? '-'}</Text>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>{set.weight || '-'}</Text>
              </View>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>{set.reps || '-'}</Text>
              </View>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>{set.rpe || '-'}</Text>
              </View>

              <View style={[styles.checkBubble, set.isCompleted && styles.checkBubbleDone]}>
                <Ionicons
                  name="checkmark"
                  size={22}
                  color={set.isCompleted ? '#FFFFFF' : COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.restRow}>
              <View style={styles.restDivider} />
              <Text style={styles.restText}>{formatRest(set.restSeconds)}</Text>
              <View style={styles.restDivider} />
            </View>
          </View>
        ))}

        <Pressable style={styles.addSetButton} onPress={onAddSet}>
          <Text style={styles.addSetText}>+ Add Set ({defaultRest})</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '600',
    marginRight: 12,
  },
  iconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconOrange: {
    width: 38,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.iconOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOlive: {
    width: 38,
    height: 32,
    borderRadius: 12,
    backgroundColor: COLORS.iconOlive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    padding: 14,
  },
  note: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
  },
  setColumn: {
    width: 48,
    textAlign: 'center',
  },
  previousColumn: {
    flex: 1,
    paddingLeft: 12,
  },
  metricColumn: {
    width: 58,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setBadge: {
    width: 42,
    height: 32,
    borderRadius: 18,
    backgroundColor: COLORS.cardBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  warmupBadge: {
    backgroundColor: COLORS.warmup,
  },
  failureBadge: {
    backgroundColor: COLORS.failure,
  },
  dropBadge: {
    backgroundColor: COLORS.dropset,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  previous: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
  },
  metricBubble: {
    width: 52,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.cardBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  metricText: {
    color: COLORS.text,
    fontSize: 16,
  },
  checkBubble: {
    width: 38,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.inactive,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  checkBubbleDone: {
    backgroundColor: COLORS.success,
  },
  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 48,
  },
  restDivider: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.accentDivider,
  },
  restText: {
    color: COLORS.accent,
    fontSize: 16,
    marginHorizontal: 10,
  },
  addSetButton: {
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  addSetText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
