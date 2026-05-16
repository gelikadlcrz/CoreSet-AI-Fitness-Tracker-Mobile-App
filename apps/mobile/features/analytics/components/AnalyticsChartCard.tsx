import { StyleSheet, Switch, Text, View } from 'react-native';
import AnalyticsLineChart from './AnalyticsLineChart';
import MetricToggleGroup from './MetricToggleGroup';
import { AnalyticsMetric, AnalyticsPoint } from '../types/analytics.types';
import {
  formatMetricValue,
  getBodyMetricSeries,
  getMetricSeries,
  METRIC_LABELS,
} from '../utils/analyticsHelpers';

const UI = {
  card: '#333333',
  border: '#444444',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  accent: '#DADA4F',
};

type Props = {
  points: AnalyticsPoint[];
  selectedMetric: AnalyticsMetric;
  onChangeMetric: (metric: AnalyticsMetric) => void;
  showBodyOverlay: boolean;
  onToggleBodyOverlay: (value: boolean) => void;
};

export default function AnalyticsChartCard({
  points,
  selectedMetric,
  onChangeMetric,
  showBodyOverlay,
  onToggleBodyOverlay,
}: Props) {
  const metricValues = getMetricSeries(points, selectedMetric);
  const latestValue = metricValues[metricValues.length - 1] ?? 0;
  const bodyValues = getBodyMetricSeries(points);

  return (
    <View style={styles.card}>
      <MetricToggleGroup
        selectedMetric={selectedMetric}
        onChangeMetric={onChangeMetric}
      />

      <View style={styles.metricHeader}>
        <View>
          <Text style={styles.metricLabel}>{METRIC_LABELS[selectedMetric]}</Text>
          <Text style={styles.metricValue}>
            {formatMetricValue(selectedMetric, latestValue)}
          </Text>
        </View>

        <View style={styles.legendBox}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Trend</Text>
        </View>
      </View>

      <AnalyticsLineChart
        points={points}
        values={metricValues}
        overlayValues={bodyValues}
        showOverlay={showBodyOverlay}
        valueLabel={showBodyOverlay ? 'Strength + Body Metric' : 'Strength Trend'}
      />

      <View style={styles.overlayRow}>
        <Text style={styles.overlayText}>Overlay Body Weight / Fat Trend</Text>
        <Switch
          value={showBodyOverlay}
          onValueChange={onToggleBodyOverlay}
          trackColor={{ false: '#262626', true: UI.accent }}
          thumbColor={showBodyOverlay ? '#111111' : '#FFFFFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 18,
    marginBottom: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: UI.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  legendBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F26035',
  },
  legendText: {
    color: UI.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  overlayRow: {
    borderTopWidth: 1,
    borderTopColor: UI.border,
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayText: {
    color: UI.textMuted,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
});
