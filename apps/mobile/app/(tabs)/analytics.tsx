import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../shared/theme';

export default function AnalyticsScreen() {
  return (
    <View style={s.root}>
      <Text style={s.t}>Analytics</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  t: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
  },
});