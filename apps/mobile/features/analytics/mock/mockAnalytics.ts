import { mapAnalyticsRowsToDataset } from '../services/analyticsMapper';
import { MOCK_ANALYTICS_DB_ROWS } from './mockAnalyticsDb';

/**
 * Compatibility export for older code that still imports MOCK_ANALYTICS_DATA.
 * The actual source is now DB-shaped mock rows from mockAnalyticsDb.ts.
 */
export const MOCK_ANALYTICS_DATA = mapAnalyticsRowsToDataset(
  MOCK_ANALYTICS_DB_ROWS,
  {
    userId: 'demo_user_001',
    range: '30d',
    exerciseId: null,
    includeManual: true,
  },
);
