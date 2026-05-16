import { AnalyticsDataset } from '../types/analytics.types';

export const EMPTY_ANALYTICS_DATASET: AnalyticsDataset = {
  points: [],
  recentSets: [],
};

export const analyticsInitialState = {
  dataset: EMPTY_ANALYTICS_DATASET,
};
