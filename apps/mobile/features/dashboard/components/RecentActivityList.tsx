import { StyleSheet, View } from 'react-native';
import type { DashboardRecentActivity } from '../types/dashboard.types';
import RecentActivityCard from './RecentActivityCard';

type Props = {
  activities: DashboardRecentActivity[];
};

export default function RecentActivityList({ activities }: Props) {
  return (
    <View style={styles.list}>
      {activities.map((activity) => (
        <RecentActivityCard key={activity.id} activity={activity} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 28,
  },
});
