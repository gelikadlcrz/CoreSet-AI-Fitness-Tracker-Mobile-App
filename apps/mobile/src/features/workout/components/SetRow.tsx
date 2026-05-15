import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../../../shared/theme';

type Props = {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
};

export default function SetRow({
  setNumber,
  weight,
  reps,
  rpe,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{setNumber}</Text>
      <Text style={styles.text}>{weight} kg</Text>
      <Text style={styles.text}>{reps}</Text>
      <Text style={styles.text}>{rpe}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  text: {
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  },
});