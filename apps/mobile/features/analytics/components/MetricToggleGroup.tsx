import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnalyticsMetric } from '../types/analytics.types';
import { METRIC_OPTIONS } from '../utils/analyticsHelpers';

const UI = {
  border: '#444444',
  textMuted: '#A0A0A0',
  orange: '#F26035',
};

type Props = {
  selectedMetric: AnalyticsMetric;
  onChangeMetric: (metric: AnalyticsMetric) => void;
};

export default function MetricToggleGroup({
  selectedMetric,
  onChangeMetric,
}: Props) {
  return (
    <View style={styles.container}>
      {METRIC_OPTIONS.map((option) => {
        const isActive = selectedMetric === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChangeMetric(option.value)}
            style={[styles.button, isActive && styles.activeButton]}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  activeButton: {
    borderColor: UI.orange,
    backgroundColor: 'rgba(242, 96, 53, 0.12)',
  },
  text: {
    color: UI.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  activeText: {
    color: UI.orange,
  },
});
