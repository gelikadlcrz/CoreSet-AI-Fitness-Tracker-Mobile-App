import {
  AnalyticsDataset,
  AnalyticsQueryParams,
  ExportAnalyticsOptions,
  SetHistoryItem,
} from '../types/analytics.types';
import { mapAnalyticsRowsToDataset } from './analyticsMapper';
import { AnalyticsRepository, MockAnalyticsRepository } from './analyticsRepository';

const DEFAULT_QUERY: AnalyticsQueryParams = {
  userId: 'demo_user_001',
  range: '30d',
  exerciseId: null,
  includeManual: true,
};

let analyticsRepository: AnalyticsRepository = MockAnalyticsRepository;

export function setAnalyticsRepository(repository: AnalyticsRepository) {
  analyticsRepository = repository;
}

export async function getAnalyticsDataset(
  params: Partial<AnalyticsQueryParams> = {},
): Promise<AnalyticsDataset> {
  const query: AnalyticsQueryParams = {
    ...DEFAULT_QUERY,
    ...params,
  };

  const rows = await analyticsRepository.getRows(query);
  return mapAnalyticsRowsToDataset(rows, query);
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
