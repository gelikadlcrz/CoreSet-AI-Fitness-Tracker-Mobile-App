import { ScrollView, StyleSheet } from 'react-native';
import type { DashboardRoutine } from '../types/dashboard.types';
import RoutineCard from './RoutineCard';

type Props = {
  routines: DashboardRoutine[];
  onPressRoutine: (routineId: string) => void;
};

export default function RoutineQuickLaunch({ routines, onPressRoutine }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {routines.map((routine) => (
        <RoutineCard key={routine.id} routine={routine} onPress={onPressRoutine} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 28,
    marginHorizontal: -4,
  },
  content: {
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
});
