import { useMemo, useState } from 'react';
import {
  AnalyticsDateRange,
  AnalyticsMetric,
  ExportFormat,
} from '../types/analytics.types';
import { analyticsInitialState } from '../store/analyticsStore';
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

  const dataset = analyticsInitialState.dataset;

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
  };
}
