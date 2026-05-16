import { Alert, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  AnalyticsDateRange,
  AnalyticsMetric,
  ExportFormat,
} from '../types/analytics.types';

const UI = {
  overlay: 'rgba(0, 0, 0, 0.72)',
  card: '#333333',
  input: '#262626',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  accent: '#DADA4F',
  border: '#444444',
};

type Props = {
  visible: boolean;
  range: AnalyticsDateRange;
  metric: AnalyticsMetric;
  format: ExportFormat;
  excludeManualSets: boolean;
  onChangeFormat: (format: ExportFormat) => void;
  onToggleExcludeManualSets: (value: boolean) => void;
  onClose: () => void;
};

export default function ExportAnalyticsModal({
  visible,
  range,
  metric,
  format,
  excludeManualSets,
  onChangeFormat,
  onToggleExcludeManualSets,
  onClose,
}: Props) {
  const handleMockExport = () => {
    Alert.alert(
      'Mock export ready',
      `${format.toUpperCase()} export prepared for ${range}, ${metric}. Manual sets ${
        excludeManualSets ? 'excluded' : 'included'
      }.`,
    );
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <Text style={styles.title}>Export Data</Text>

          <Text style={styles.label}>Format</Text>
          <View style={styles.formatRow}>
            <Pressable
              onPress={() => onChangeFormat('csv')}
              style={[styles.formatButton, format === 'csv' && styles.activeButton]}
            >
              <Text style={[styles.formatText, format === 'csv' && styles.activeText]}>
                CSV
              </Text>
              <Text style={styles.formatSubtext}>Spreadsheet</Text>
            </Pressable>

            <Pressable
              onPress={() => onChangeFormat('pdf')}
              style={[styles.formatButton, format === 'pdf' && styles.activeButton]}
            >
              <Text style={[styles.formatText, format === 'pdf' && styles.activeText]}>
                PDF
              </Text>
              <Text style={styles.formatSubtext}>Report</Text>
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Exclude Manual Sets</Text>
              <Text style={styles.switchDescription}>
                Only export logs tracked and verified by the AI model.
              </Text>
            </View>

            <Switch
              value={excludeManualSets}
              onValueChange={onToggleExcludeManualSets}
              trackColor={{ false: UI.input, true: UI.accent }}
              thumbColor={excludeManualSets ? '#111111' : '#FFFFFF'}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable style={styles.primaryButton} onPress={handleMockExport}>
              <Text style={styles.primaryText}>Download</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: UI.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: UI.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 24,
  },
  title: {
    color: UI.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 18,
  },
  label: {
    color: UI.textMuted,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  formatButton: {
    flex: 1,
    backgroundColor: UI.input,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 10,
    padding: 14,
  },
  activeButton: {
    borderColor: UI.accent,
    backgroundColor: 'rgba(218, 218, 79, 0.12)',
  },
  formatText: {
    color: UI.text,
    fontSize: 15,
    fontWeight: '900',
  },
  activeText: {
    color: UI.accent,
  },
  formatSubtext: {
    color: UI.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchCopy: {
    flex: 1,
  },
  switchTitle: {
    color: UI.text,
    fontSize: 15,
    fontWeight: '800',
  },
  switchDescription: {
    color: UI.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: UI.input,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: UI.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: UI.text,
    fontSize: 14,
    fontWeight: '800',
  },
  primaryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});
