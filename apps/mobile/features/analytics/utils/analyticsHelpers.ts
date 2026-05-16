import {
  AnalyticsDateRange,
  AnalyticsMetric,
  AnalyticsPoint,
  SetHistoryItem,
} from '../types/analytics.types';

export const DATE_RANGE_OPTIONS: Array<{
  label: string;
  value: AnalyticsDateRange;
}> = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export const METRIC_OPTIONS: Array<{
  label: string;
  value: AnalyticsMetric;
}> = [
  { label: 'Est. 1RM', value: 'estimated1RM' },
  { label: 'Total Volume', value: 'totalVolume' },
  { label: 'VLwD', value: 'vlwd' },
  { label: 'TUT', value: 'tut' },
];

export const METRIC_LABELS: Record<AnalyticsMetric, string> = {
  estimated1RM: 'Estimated 1RM',
  totalVolume: 'Total Session Volume',
  vlwd: 'Volume Load w/ Displacement',
  tut: 'Time Under Tension',
};

export const METRIC_UNITS: Record<AnalyticsMetric, string> = {
  estimated1RM: 'kg',
  totalVolume: 'kg',
  vlwd: 'VLwD',
  tut: 'sec',
};

export function formatMetricValue(metric: AnalyticsMetric, value: number) {
  if (metric === 'estimated1RM') {
    return `${value.toFixed(1)} kg`;
  }

  if (metric === 'vlwd') {
    return `${Math.round(value)} VLwD`;
  }

  if (metric === 'tut') {
    return `${Math.round(value)} sec`;
  }

  return `${Math.round(value).toLocaleString()} kg`;
}

export function formatShortDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function getLatestDate(points: AnalyticsPoint[], recentSets: SetHistoryItem[]) {
  const timestamps = [
    ...points.map((point) => new Date(point.date).getTime()),
    ...recentSets.map((set) => new Date(set.performedAt).getTime()),
  ];

  if (timestamps.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...timestamps));
}

export function filterAnalyticsPointsByRange(
  points: AnalyticsPoint[],
  recentSets: SetHistoryItem[],
  range: AnalyticsDateRange,
) {
  if (range === 'all') {
    return points;
  }

  const latestDate = getLatestDate(points, recentSets);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const startDate = subtractDays(latestDate, days);

  return points.filter((point) => new Date(point.date) >= startDate);
}

export function filterSetHistoryByRange(
  sets: SetHistoryItem[],
  points: AnalyticsPoint[],
  range: AnalyticsDateRange,
) {
  if (range === 'all') {
    return [...sets].sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );
  }

  const latestDate = getLatestDate(points, sets);
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const startDate = subtractDays(latestDate, days);

  return sets
    .filter((set) => new Date(set.performedAt) >= startDate)
    .sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );
}

export function getMetricSeries(
  points: AnalyticsPoint[],
  metric: AnalyticsMetric,
) {
  return points.map((point) => point[metric]);
}

export function getBodyMetricSeries(points: AnalyticsPoint[]) {
  return points.map((point) => point.bodyWeightKg ?? 0);
}
