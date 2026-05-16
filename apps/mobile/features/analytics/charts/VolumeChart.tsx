import AnalyticsLineChart from '../components/AnalyticsLineChart';
import { AnalyticsPoint } from '../types/analytics.types';

export default function VolumeChart({ points }: { points: AnalyticsPoint[] }) {
  return (
    <AnalyticsLineChart
      points={points}
      values={points.map((point) => point.totalVolume)}
      valueLabel="Total Volume"
    />
  );
}
