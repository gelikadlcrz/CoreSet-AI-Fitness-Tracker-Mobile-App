import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { DashboardRecentActivity } from '../types/dashboard.types';

const UI = {
  card: '#222222',
  cardLight: '#2A2A2A',
  border: '#3A3A3A',
  text: '#FFFFFF',
  muted: '#8E8E93',
  orange: '#FF5A36',
};

type Props = {
  activity: DashboardRecentActivity;
};

export default function RecentActivityCard({ activity }: Props) {
  return (
    <Pressable style={styles.card}>
      {activity.thumbnailUrl ? (
        <Image source={{ uri: activity.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={styles.thumb} />
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{activity.title}</Text>
        <Text style={styles.date} numberOfLines={1}>{activity.dateTimeLabel}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Total Volume</Text>
          <Text style={styles.volumeValue}>{activity.totalVolumeLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.durationValue}>{activity.durationLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: UI.card,
    borderColor: UI.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  thumb: {
    backgroundColor: '#929292',
    borderRadius: 10,
    height: 48,
    marginRight: 10,
    width: 48,
  },
  info: {
    flex: 1,
    marginRight: 8,
    minWidth: 80,
  },
  name: {
    color: UI.text,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
  },
  date: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '700',
  },
  stats: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statBlock: {
    minWidth: 56,
  },
  statLabel: {
    color: UI.muted,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 3,
  },
  volumeValue: {
    color: UI.orange,
    fontSize: 12,
    fontWeight: '900',
  },
  durationValue: {
    color: UI.text,
    fontSize: 12,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: UI.border,
    height: 26,
    marginHorizontal: 8,
    width: 1,
  },
});
