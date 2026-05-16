import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AnalyticsDateRange } from '../types/analytics.types';
import { DATE_RANGE_OPTIONS } from '../utils/analyticsHelpers';

const UI = {
  input: '#262626',
  textMuted: '#A0A0A0',
  accent: '#DADA4F',
};

type Props = {
  selectedRange: AnalyticsDateRange;
  onChangeRange: (range: AnalyticsDateRange) => void;
};

export default function AnalyticsPillGroup({
  selectedRange,
  onChangeRange,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DATE_RANGE_OPTIONS.map((option) => {
        const isActive = selectedRange === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChangeRange(option.value)}
            style={[styles.pill, isActive && styles.activePill]}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 4,
  },
  pill: {
    backgroundColor: UI.input,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  activePill: {
    backgroundColor: UI.accent,
  },
  text: {
    color: UI.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeText: {
    color: '#000',
  },
});
