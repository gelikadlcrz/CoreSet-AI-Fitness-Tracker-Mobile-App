import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/shared/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type SetItem = {
  id: string;
  reps: number;
  weight: number;
  rpe: number;
  previous?: string;
  status?: 'normal' | 'warmup' | 'failure' | 'dropset';
};

type Props = {
  title: string;
  note?: string;
  sets: SetItem[];
};

export default function ExerciseCard({
  title,
  note,
  sets,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.iconsRow}>
          <View style={styles.iconOrange}>
            <Ionicons
              name="camera"
              size={18}
              color="#FFF6A8"
            />
          </View>

          <View style={styles.iconOlive}>
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color="#E8FF2A"
            />
          </View>

          <View style={styles.iconOlive}>
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color="#E8FF2A"
            />
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
          <Text style={[styles.label, styles.setColumn]}>
            Set
          </Text>

          <Text style={[styles.label, styles.previousColumn]}>
            Previous
          </Text>

          <Text style={[styles.label, styles.metricColumn]}>
            kg
          </Text>

          <Text style={[styles.label, styles.metricColumn]}>
            Reps
          </Text>

          <Text style={[styles.label, styles.metricColumn]}>
            RPE
          </Text>
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
                <Text style={styles.badgeText}>
                  {set.status === 'warmup'
                    ? 'W'
                    : set.status === 'failure'
                    ? 'F'
                    : set.status === 'dropset'
                    ? 'D'
                    : index + 1}
                </Text>
              </View>

              <Text style={styles.previous}>
                {set.previous ?? '-'}
              </Text>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>
                  {set.weight}
                </Text>
              </View>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>
                  {set.reps}
                </Text>
              </View>

              <View style={styles.metricBubble}>
                <Text style={styles.metricText}>
                  {set.rpe}
                </Text>
              </View>

              <View style={styles.checkBubble}>
                <Ionicons
                  name="checkmark"
                  size={26}
                  color="#18D12F"
                />
              </View>
            </View>

            <View style={styles.restRow}>
              <View style={styles.restDivider} />

              <Text style={styles.restText}>3:00</Text>

              <View style={styles.restDivider} />
            </View>
          </View>
        ))}

        <View style={styles.addSetButton}>
          <Text style={styles.addSetText}>
            + Add Set (3:00)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  title: {
    flex: 1,
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '500',
    marginRight: 12,
  },

  iconsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  iconOrange: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.iconOrange,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconOlive: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.iconOlive,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 20,
    padding: 16,
  },

  note: {
    color: '#8F8F8F',
    fontSize: 14,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  label: {
    color: '#F5F5F5',
    fontSize: 15,
  },

  setColumn: {
    width: 58,
  },

  previousColumn: {
    flex: 1,
  },

  metricColumn: {
    width: 68,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  setBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    fontSize: 20,
    fontWeight: '600',
  },

  previous: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
  },

  metricBubble: {
    width: 58,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBubble,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  metricText: {
    color: COLORS.text,
    fontSize: 18,
  },

  checkBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.inactive,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  restDivider: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.accentDivider,
  },

  restText: {
    color: COLORS.accent,
    fontSize: 18,
    marginHorizontal: 10,
  },

  addSetButton: {
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  addSetText: {
    color: COLORS.text,
    fontSize: 17,
  },
});