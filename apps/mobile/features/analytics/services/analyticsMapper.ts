import {
  calculateEstimated1RM,
  calculateTimeUnderTension,
  calculateTotalVolume,
  calculateVLwD,
} from '../calculations/calculateVLwD';
import {
  AnalyticsDataset,
  AnalyticsDbRows,
  AnalyticsQueryParams,
  BodyMetricRow,
  PoseRepMetricRow,
  SetHistoryItem,
  WorkoutSetRow,
} from '../types/analytics.types';

export function mapAnalyticsRowsToDataset(
  rows: AnalyticsDbRows,
  params: AnalyticsQueryParams,
): AnalyticsDataset {
  const exerciseById = new Map(
    rows.exercises.map((exercise) => [exercise.exercise_id, exercise]),
  );

  const repMetricsBySetId = groupBySetId(rows.poseRepMetrics);

  const filteredSets = rows.workoutSets
    .filter((set) => set.user_id === params.userId)
    .filter((set) => !params.exerciseId || set.exercise_id === params.exerciseId)
    .filter((set) => params.includeManual !== false || set.verification_status === 'ai_verified');

  const recentSets = filteredSets
    .map<SetHistoryItem>((set) => {
      const repMetrics = repMetricsBySetId.get(set.set_id) ?? [];
      const averageDisplacementM = average(repMetrics.map((rep) => rep.displacement_m));
      const averageRepDurationSec = average(repMetrics.map((rep) => rep.duration_sec));
      const exerciseName = exerciseById.get(set.exercise_id)?.name ?? 'Unknown Exercise';

      return {
        id: set.set_id,
        setId: set.set_id,
        sessionId: set.session_id,
        exerciseId: set.exercise_id,
        exerciseName,
        performedAt: set.performed_at,
        weightKg: set.weight_kg,
        reps: set.reps,
        rpe: set.rpe,
        verificationStatus: set.verification_status,
        averageDisplacementM,
        averageRepDurationSec,
        estimated1RM: roundOne(calculateEstimated1RM(set.weight_kg, set.reps)),
        totalVolume: roundOne(calculateTotalVolume(set.weight_kg, set.reps)),
        vlwd: roundOne(calculateVLwD(set.weight_kg, set.reps, averageDisplacementM)),
        tut: roundOne(calculateTimeUnderTension(set.reps, averageRepDurationSec)),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );

  const bodyMetrics = rows.bodyMetrics
    .filter((metric) => metric.user_id === params.userId)
    .sort(
      (a, b) =>
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime(),
    );

  const points = buildDailyAnalyticsPoints(recentSets, bodyMetrics);

  return {
    points,
    recentSets,
  };
}

function buildDailyAnalyticsPoints(
  sets: SetHistoryItem[],
  bodyMetrics: BodyMetricRow[],
) {
  const groupedByDate = new Map<string, SetHistoryItem[]>();

  sets.forEach((set) => {
    const dayKey = set.performedAt.slice(0, 10);
    const existing = groupedByDate.get(dayKey) ?? [];
    existing.push(set);
    groupedByDate.set(dayKey, existing);
  });

  return [...groupedByDate.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, dailySets]) => {
      const bodyMetric = findClosestBodyMetric(date, bodyMetrics);

      return {
        id: `analytics_${date}`,
        date,
        estimated1RM: roundOne(Math.max(...dailySets.map((set) => set.estimated1RM))),
        totalVolume: roundOne(sum(dailySets.map((set) => set.totalVolume))),
        vlwd: roundOne(sum(dailySets.map((set) => set.vlwd))),
        tut: roundOne(sum(dailySets.map((set) => set.tut))),
        bodyWeightKg: bodyMetric?.body_weight_kg,
        bodyFatPercent: bodyMetric?.body_fat_percent ?? undefined,
      };
    });
}

function groupBySetId(repMetrics: PoseRepMetricRow[]) {
  return repMetrics.reduce((map, repMetric) => {
    const existing = map.get(repMetric.set_id) ?? [];
    existing.push(repMetric);
    map.set(repMetric.set_id, existing);
    return map;
  }, new Map<string, PoseRepMetricRow[]>());
}

function findClosestBodyMetric(date: string, bodyMetrics: BodyMetricRow[]) {
  const target = new Date(`${date}T23:59:59.999Z`).getTime();

  return [...bodyMetrics]
    .filter((metric) => new Date(metric.measured_at).getTime() <= target)
    .sort(
      (a, b) =>
        new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime(),
    )[0];
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function roundOne(value: number) {
  return Number(value.toFixed(1));
}
