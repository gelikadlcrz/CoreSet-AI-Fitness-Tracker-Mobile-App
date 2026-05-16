import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AnalyticsChartCard from '../components/AnalyticsChartCard';
import AnalyticsPillGroup from '../components/AnalyticsPillGroup';
import ExportAnalyticsModal from '../components/ExportAnalyticsModal';
import HistoryFeed from '../components/HistoryFeed';
import { useAnalytics } from '../hooks/useAnalytics';

const UI = {
  background: '#000000',
  surface: '#1A1A1A',
  input: '#262626',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  border: '#444444',
};

export default function AnalyticsScreen() {
  const analytics = useAnalytics();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Analytics</Text>

          <Pressable
            style={styles.exportButton}
            onPress={() => analytics.setExportModalVisible(true)}
          >
            <Text style={styles.exportText}>Export</Text>
          </Pressable>
        </View>

        <AnalyticsPillGroup
          selectedRange={analytics.selectedRange}
          onChangeRange={analytics.setSelectedRange}
        />

        {analytics.isLoading ? (
          <Text style={styles.helperText}>Loading analytics...</Text>
        ) : null}

        {analytics.error ? (
          <Text style={styles.errorText}>{analytics.error}</Text>
        ) : null}

        <AnalyticsChartCard
          points={analytics.filteredPoints}
          selectedMetric={analytics.selectedMetric}
          onChangeMetric={analytics.setSelectedMetric}
          showBodyOverlay={analytics.showBodyOverlay}
          onToggleBodyOverlay={analytics.setShowBodyOverlay}
        />

        <HistoryFeed sets={analytics.filteredSets} />
      </ScrollView>

      <ExportAnalyticsModal
        visible={analytics.exportModalVisible}
        range={analytics.selectedRange}
        metric={analytics.selectedMetric}
        format={analytics.exportFormat}
        excludeManualSets={analytics.excludeManualSets}
        onChangeFormat={analytics.setExportFormat}
        onToggleExcludeManualSets={analytics.setExcludeManualSets}
        onClose={() => analytics.setExportModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI.background,
  },
  container: {
    flex: 1,
    backgroundColor: UI.background,
  },
  content: {
    backgroundColor: UI.surface,
    borderRadius: 24,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: UI.text,
    fontSize: 22,
    fontWeight: '900',
  },
  exportButton: {
    backgroundColor: UI.input,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  exportText: {
    color: UI.text,
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: UI.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
});
