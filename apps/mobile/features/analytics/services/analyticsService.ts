import { MOCK_ANALYTICS_DATA } from '../mock/mockAnalytics';
import {
  AnalyticsDataset,
  ExportAnalyticsOptions,
  SetHistoryItem,
} from '../types/analytics.types';

export async function getAnalyticsDataset(): Promise<AnalyticsDataset> {
  return Promise.resolve(MOCK_ANALYTICS_DATA);
}

export async function exportAnalyticsData(
  options: ExportAnalyticsOptions,
  sets: SetHistoryItem[],
) {
  const exportedSets = options.excludeManualSets
    ? sets.filter((set) => set.verificationStatus === 'ai_verified')
    : sets;

  return Promise.resolve({
    fileName: `coreset-analytics-${options.range}.${options.format}`,
    format: options.format,
    metric: options.metric,
    includedSetCount: exportedSets.length,
    excludedManualSets: options.excludeManualSets,
  });
}
