import { useEffect, useMemo, useState } from 'react';
import {
  AnalyticsDateRange,
  AnalyticsDataset,
  AnalyticsMetric,
  ExportFormat,
} from '../types/analytics.types';
import { analyticsInitialState } from '../store/analyticsStore';
import { getAnalyticsDataset } from '../services/analyticsService';
import {
  filterAnalyticsPointsByRange,
  filterSetHistoryByRange,
} from '../utils/analyticsHelpers';

export function useAnalytics() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsDateRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>('estimated1RM');
  const [showBodyOverlay, setShowBodyOverlay] = useState(true);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [excludeManualSets, setExcludeManualSets] = useState(false);
  const [dataset, setDataset] = useState<AnalyticsDataset>(
    analyticsInitialState.dataset,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        setIsLoading(true);
        setError(null);

        const nextDataset = await getAnalyticsDataset({
          userId: 'demo_user_001',
          range: selectedRange,
          includeManual: true,
        });

        if (isMounted) {
          setDataset(nextDataset);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load analytics data.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  const filteredPoints = useMemo(
    () =>
      filterAnalyticsPointsByRange(
        dataset.points,
        dataset.recentSets,
        selectedRange,
      ),
    [dataset.points, dataset.recentSets, selectedRange],
  );

  const filteredSets = useMemo(
    () =>
      filterSetHistoryByRange(
        dataset.recentSets,
        dataset.points,
        selectedRange,
      ),
    [dataset.points, dataset.recentSets, selectedRange],
  );

  return {
    selectedRange,
    setSelectedRange,
    selectedMetric,
    setSelectedMetric,
    showBodyOverlay,
    setShowBodyOverlay,
    exportModalVisible,
    setExportModalVisible,
    exportFormat,
    setExportFormat,
    excludeManualSets,
    setExcludeManualSets,
    filteredPoints,
    filteredSets,
    isLoading,
    error,
  };
}
