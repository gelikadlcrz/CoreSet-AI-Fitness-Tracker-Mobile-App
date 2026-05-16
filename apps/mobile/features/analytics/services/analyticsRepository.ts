import { MOCK_ANALYTICS_DB_ROWS } from '../mock/mockAnalyticsDb';
import { AnalyticsDbRows, AnalyticsQueryParams } from '../types/analytics.types';

export interface AnalyticsRepository {
  getRows(params: AnalyticsQueryParams): Promise<AnalyticsDbRows>;
}

/**
 * Temporary repository for frontend testing.
 * Replace this with ApiAnalyticsRepository when the backend endpoint is ready.
 */
export const MockAnalyticsRepository: AnalyticsRepository = {
  async getRows() {
    return MOCK_ANALYTICS_DB_ROWS;
  },
};

/**
 * Example API repository. Use this when the backend already returns DB-shaped rows.
 * Expected response shape: AnalyticsDbRows.
 */
export function createApiAnalyticsRepository(baseUrl: string): AnalyticsRepository {
  return {
    async getRows(params: AnalyticsQueryParams) {
      const searchParams = new URLSearchParams({ userId: params.userId });

      if (params.range) {
        searchParams.set('range', params.range);
      }

      if (params.exerciseId) {
        searchParams.set('exerciseId', params.exerciseId);
      }

      if (params.includeManual !== undefined) {
        searchParams.set('includeManual', String(params.includeManual));
      }

      const response = await fetch(`${baseUrl}/analytics/progression?${searchParams}`);

      if (!response.ok) {
        throw new Error('Failed to load analytics rows.');
      }

      return response.json() as Promise<AnalyticsDbRows>;
    },
  };
}
