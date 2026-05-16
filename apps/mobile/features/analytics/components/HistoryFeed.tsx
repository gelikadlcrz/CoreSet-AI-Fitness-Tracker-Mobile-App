import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SetHistoryItem } from '../types/analytics.types';
import { formatShortDate } from '../utils/analyticsHelpers';

const UI = {
  input: '#262626',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  accent: '#DADA4F',
  border: '#444444',
};

type Props = {
  sets: SetHistoryItem[];
};

function VerificationBadge({ status }: { status: SetHistoryItem['verificationStatus'] }) {
  const isVerified = status === 'ai_verified';

  return (
    <View style={[styles.badge, isVerified ? styles.aiBadge : styles.manualBadge]}>
      <Text style={[styles.badgeText, isVerified ? styles.aiText : styles.manualText]}>
        {isVerified ? 'AI Verified' : 'Manual'}
      </Text>
    </View>
  );
}

export default function HistoryFeed({ sets }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Recent Sets</Text>

      <View style={styles.list}>
        {sets.map((set) => (
          <Pressable key={set.id} style={styles.item}>
            <View style={styles.details}>
              <Text style={styles.title}>{set.exerciseName}</Text>
              <Text style={styles.meta}>
                {formatShortDate(set.performedAt)} • {set.weightKg}kg x {set.reps} •{' '}
                {set.rpe} RPE
              </Text>
            </View>

            <VerificationBadge status={set.verificationStatus} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: UI.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  list: {
    gap: 12,
  },
  item: {
    backgroundColor: UI.input,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: UI.text,
    fontSize: 14,
    fontWeight: '800',
  },
  meta: {
    color: UI.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  aiBadge: {
    backgroundColor: 'rgba(218, 218, 79, 0.15)',
    borderColor: 'rgba(218, 218, 79, 0.35)',
  },
  manualBadge: {
    backgroundColor: 'rgba(85, 85, 85, 0.2)',
    borderColor: UI.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  aiText: {
    color: UI.accent,
  },
  manualText: {
    color: UI.textMuted,
  },
});
