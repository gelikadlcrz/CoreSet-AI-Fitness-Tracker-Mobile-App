import { useEffect, useMemo, useState } from 'react';

import {
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../shared/theme';
import DeleteConfirmationModal from '../../src/features/settings/components/DeleteConfirmationModal';

import {
  DEFAULT_SETTINGS,
  formatRestTime,
  getOrCreateSettings,
  saveSettings,
} from '../../src/features/settings/services/settingsService';

import type { SettingsDraft } from '../../src/features/settings/types/settings.types';

type ChoiceConfig = {
  title: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
};

type ThemePalette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  border: string;
  divider: string;
  input: string;
  danger: string;
};

const DARK_THEME: ThemePalette = {
  background: COLORS.background,
  surface: COLORS.surface,
  surfaceSecondary: COLORS.surfaceSecondary,
  surfaceTertiary: COLORS.surfaceTertiary,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  accent: COLORS.accent,
  border: COLORS.border,
  divider: COLORS.divider,
  input: COLORS.input,
  danger: COLORS.danger,
};

const LIGHT_THEME: ThemePalette = {
  background: '#F4F4EF',
  surface: '#FFFFFF',
  surfaceSecondary: '#ECEDE4',
  surfaceTertiary: '#E2E3D9',
  text: '#111111',
  textSecondary: '#4F4F4F',
  textMuted: '#767676',
  accent: COLORS.accent,
  border: '#C9CABC',
  divider: '#E1E1D8',
  input: '#F0F1E8',
  danger: COLORS.danger,
};

const GOALS = [
  'General Fitness',
  'Hypertrophy',
  'Strength',
  'Fat Loss',
  'Endurance',
  'Mobility',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const GENDERS = ['Male', 'Female', 'Prefer not to say'];
const BODY_TYPES = ['Ectomorph', 'Mesomorph', 'Endomorph', 'Balanced'];
const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 300];

function range(start: number, end: number, step = 1) {
  const values: string[] = [];

  for (let value = start; value <= end; value += step) {
    values.push(String(value));
  }

  return values;
}

function cloneDraft(draft: SettingsDraft): SettingsDraft {
  return JSON.parse(JSON.stringify(draft)) as SettingsDraft;
}

function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462);
}

function lbsToKg(lbs: number) {
  return Math.round(lbs / 2.20462);
}

function getWeightLabel(draft: SettingsDraft) {
  if (draft.preferences.weightUnit === 'lbs') {
    return `${kgToLbs(draft.bodyStats.weightKg)} lbs`;
  }

  return `${draft.bodyStats.weightKg} kg`;
}

function getWeightChoices(unit: SettingsDraft['preferences']['weightUnit']) {
  if (unit === 'lbs') {
    return range(80, 400).map(value => `${value} lbs`);
  }

  return range(35, 180).map(value => `${value} kg`);
}

function parseWeightToKg(value: string) {
  if (value.endsWith('lbs')) {
    return lbsToKg(Number(value.replace(' lbs', '')));
  }

  return Number(value.replace(' kg', ''));
}

function triggerHaptic(enabled: boolean) {
  if (enabled) {
    Vibration.vibrate(8);
  }
}

function ChoiceModal({
  config,
  onClose,
  theme,
}: {
  config: ChoiceConfig | null;
  onClose: () => void;
  theme: ThemePalette;
}) {
  if (!config) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{config.title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]}
            >
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.choiceScroll} showsVerticalScrollIndicator={false}>
            {config.values.map(value => {
              const selected = value === config.selected;

              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.choiceItem,
                    { backgroundColor: theme.surfaceSecondary },
                    selected && { backgroundColor: theme.accent },
                  ]}
                  onPress={() => {
                    config.onSelect(value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      { color: theme.text },
                      selected && styles.choiceTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={20} color="#000" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SaveConfirmationModal({
  visible,
  onCancel,
  onConfirm,
  theme,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  theme: ThemePalette;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={[styles.confirmCard, { backgroundColor: theme.surface }]}> 
          <Ionicons name="save-outline" size={46} color={theme.accent} />
          <Text style={[styles.confirmTitle, { color: theme.text }]}>Save changes?</Text>
          <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}> 
            This will save your profile, body stats, workout defaults, and AI configuration to the local database.
          </Text>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.cancelSaveButton, { backgroundColor: theme.surfaceSecondary }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelSaveText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmSaveButton} onPress={onConfirm}>
              <Text style={styles.confirmSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ThemePalette;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  children,
  noBorder,
  onPress,
  theme,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  noBorder?: boolean;
  onPress?: () => void;
  theme: ThemePalette;
}) {
  const content = (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.divider },
        noBorder && styles.noBorder,
      ]}
    >
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      {children ? (
        <View style={styles.rowRight}>{children}</View>
      ) : (
        <View style={styles.rowValueWrap}>
          <Text style={[styles.rowValue, { color: theme.accent }]}>{value}</Text>
          {!!onPress && <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />}
        </View>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      {content}
    </TouchableOpacity>
  );
}

function TogglePill({
  leftLabel,
  rightLabel,
  selected,
  onLeftPress,
  onRightPress,
  theme,
}: {
  leftLabel: string;
  rightLabel: string;
  selected: 'left' | 'right';
  onLeftPress: () => void;
  onRightPress: () => void;
  theme: ThemePalette;
}) {
  return (
    <View style={[styles.toggleContainer, { backgroundColor: theme.input }]}> 
      <TouchableOpacity
        style={[styles.toggleOption, selected === 'left' && { backgroundColor: theme.accent }]}
        onPress={onLeftPress}
      >
        <Text
          style={[
            styles.toggleText,
            { color: theme.textMuted },
            selected === 'left' && styles.toggleActiveText,
          ]}
        >
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleOption, selected === 'right' && { backgroundColor: theme.accent }]}
        onPress={onRightPress}
      >
        <Text
          style={[
            styles.toggleText,
            { color: theme.textMuted },
            selected === 'right' && styles.toggleActiveText,
          ]}
        >
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileSummary({ draft, theme }: { draft: SettingsDraft; theme: ThemePalette }) {
  return (
    <View style={[styles.profileCard, { borderBottomColor: theme.divider }]}> 
      <View style={[styles.avatar, { backgroundColor: theme.surfaceSecondary }]}> 
        <Ionicons name="person" size={42} color={theme.textMuted} />
      </View>

      <View style={styles.profileTextWrap}>
        <Text style={[styles.profileName, { color: theme.text }]}>{draft.profile.displayName}</Text>
        <Text style={[styles.profileGoal, { color: theme.accent }]}>{draft.profile.goal} Goal</Text>
        <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>{draft.profile.level}</Text>
        <Text style={[styles.profileMeta, { color: theme.textSecondary }]}> 
          {draft.profile.gender} • {draft.profile.age} yrs old
        </Text>
      </View>
    </View>
  );
}

function PercentSlider({
  value,
  onChange,
  theme,
}: {
  value: number;
  onChange: (value: number) => void;
  theme: ThemePalette;
}) {
  const [width, setWidth] = useState(0);

  const clamp = (next: number) => Math.max(0, Math.min(100, Math.round(next)));

  const updateFromX = (x: number) => {
    if (!width) return;
    onChange(clamp((x / width) * 100));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event => updateFromX(event.nativeEvent.locationX),
        onPanResponderMove: event => updateFromX(event.nativeEvent.locationX),
      }),
    [width],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.sliderWrap}>
      <View
        style={[styles.sliderTrack, { backgroundColor: theme.border }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${clamp(value)}%`, backgroundColor: theme.accent }]} />
        <View
          style={[
            styles.sliderThumb,
            {
              backgroundColor: theme.accent,
              left: width ? Math.max(0, Math.min(width - 22, (clamp(value) / 100) * width - 11)) : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [choiceConfig, setChoiceConfig] = useState<ChoiceConfig | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saveConfirmVisible, setSaveConfirmVisible] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Save');

  const theme = draft.preferences.theme === 'light' ? LIGHT_THEME : DARK_THEME;

  useEffect(() => {
    getOrCreateSettings()
      .then(settings => setDraft(settings))
      .catch(error => {
        console.log('Settings load error', error);
      });
  }, []);

  const updateDraft = (updater: (next: SettingsDraft) => void) => {
    setDraft(current => {
      const next = cloneDraft(current);
      updater(next);
      return next;
    });
  };

  const updatePreferenceImmediately = (updater: (next: SettingsDraft) => void) => {
    setDraft(current => {
      const next = cloneDraft(current);
      updater(next);
      triggerHaptic(next.preferences.hapticsEnabled);
      saveSettings(next).catch(error => console.log('Immediate preference save error', error));
      return next;
    });
  };

  const confirmSave = async () => {
    setSaveConfirmVisible(false);
    setSaveLabel('Saving');

    try {
      await saveSettings(draft);
      triggerHaptic(draft.preferences.hapticsEnabled);
      setSaveLabel('Saved');
      setTimeout(() => setSaveLabel('Save'), 1200);
    } catch (error) {
      console.log('Settings save error', error);
      setSaveLabel('Retry');
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

          <TouchableOpacity style={styles.saveButton} onPress={() => setSaveConfirmVisible(true)}>
            <Text style={styles.saveText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>

        <Section title="User Profile" theme={theme}>
          <ProfileSummary draft={draft} theme={theme} />

          <Row
            label="Goal"
            value={draft.profile.goal}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Goal',
                values: GOALS,
                selected: draft.profile.goal,
                onSelect: value => updateDraft(next => { next.profile.goal = value; }),
              })
            }
          />

          <Row
            label="Training Level"
            value={draft.profile.level}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Level',
                values: LEVELS,
                selected: draft.profile.level,
                onSelect: value => updateDraft(next => { next.profile.level = value; }),
              })
            }
          />

          <Row
            label="Gender"
            value={draft.profile.gender}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Gender',
                values: GENDERS,
                selected: draft.profile.gender,
                onSelect: value => updateDraft(next => { next.profile.gender = value; }),
              })
            }
          />

          <Row
            label="Age"
            value={`${draft.profile.age}`}
            theme={theme}
            noBorder
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Age',
                values: range(13, 80),
                selected: String(draft.profile.age),
                onSelect: value => updateDraft(next => { next.profile.age = Number(value); }),
              })
            }
          />
        </Section>

        <Section title="Body Stats" theme={theme}>
          <Row
            label="Weight"
            value={getWeightLabel(draft)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Weight',
                values: getWeightChoices(draft.preferences.weightUnit),
                selected: getWeightLabel(draft),
                onSelect: value => updateDraft(next => { next.bodyStats.weightKg = parseWeightToKg(value); }),
              })
            }
          />

          <Row
            label="Height"
            value={`${draft.bodyStats.heightCm} cm`}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Height',
                values: range(130, 220).map(value => `${value} cm`),
                selected: `${draft.bodyStats.heightCm} cm`,
                onSelect: value => updateDraft(next => { next.bodyStats.heightCm = Number(value.replace(' cm', '')); }),
              })
            }
          />

          <Row
            label="Body Fat"
            value={`${draft.bodyStats.bodyFatPercent}%`}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Body Fat',
                values: range(5, 50).map(value => `${value}%`),
                selected: `${draft.bodyStats.bodyFatPercent}%`,
                onSelect: value => updateDraft(next => { next.bodyStats.bodyFatPercent = Number(value.replace('%', '')); }),
              })
            }
          />

          <Row
            label="Body Type"
            value={draft.bodyStats.bodyType}
            theme={theme}
            noBorder
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Body Type',
                values: BODY_TYPES,
                selected: draft.bodyStats.bodyType,
                onSelect: value => updateDraft(next => { next.bodyStats.bodyType = value; }),
              })
            }
          />
        </Section>

        <Section title="Preferences" theme={theme}>
          <Row label="Weight Unit" theme={theme}>
            <TogglePill
              leftLabel="kg"
              rightLabel="lbs"
              selected={draft.preferences.weightUnit === 'kg' ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.weightUnit = 'kg'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.weightUnit = 'lbs'; })}
            />
          </Row>

          <Row label="Distance Unit" theme={theme}>
            <TogglePill
              leftLabel="km"
              rightLabel="mi"
              selected={draft.preferences.distanceUnit === 'km' ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'km'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'mi'; })}
            />
          </Row>

          <Row label="App Theme" theme={theme}>
            <TogglePill
              leftLabel="Dark"
              rightLabel="Light"
              selected={draft.preferences.theme === 'dark' ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.theme = 'dark'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.theme = 'light'; })}
            />
          </Row>

          <Row label="Sound" theme={theme}>
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.soundEnabled ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.soundEnabled = true; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.soundEnabled = false; })}
            />
          </Row>

          <Row label="Haptics" theme={theme} noBorder>
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.hapticsEnabled ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.hapticsEnabled = true; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.hapticsEnabled = false; })}
            />
          </Row>
        </Section>

        <Section title="Workout Defaults" theme={theme}>
          {[
            ['Global Default Rest Interval', 'defaultRestSeconds'],
            ['Warm-up Set Rest', 'warmupRestSeconds'],
            ['Working Set Rest', 'workingRestSeconds'],
            ['Drop Set Rest', 'dropRestSeconds'],
            ['Failure Set Rest', 'failureRestSeconds'],
          ].map(([label, key], index, list) => (
            <Row
              key={key}
              label={label}
              value={formatRestTime(draft.workoutDefaults[key as keyof SettingsDraft['workoutDefaults']])}
              theme={theme}
              noBorder={index === list.length - 1}
              onPress={() =>
                setChoiceConfig({
                  title: label,
                  values: REST_OPTIONS.map(seconds => formatRestTime(seconds)),
                  selected: formatRestTime(draft.workoutDefaults[key as keyof SettingsDraft['workoutDefaults']]),
                  onSelect: value => {
                    const [minutes, seconds] = value.split(':').map(Number);
                    updateDraft(next => {
                      next.workoutDefaults[key as keyof SettingsDraft['workoutDefaults']] = minutes * 60 + seconds;
                    });
                  },
                })
              }
            />
          ))}
        </Section>

        <Section title="AI Configuration" theme={theme}>
          <View style={styles.aiHeaderRow}>
            <Text style={[styles.sliderLabel, { color: theme.text }]}>Model Confidence Threshold</Text>
            <Text style={styles.aiValue}>{draft.ai.confidenceThreshold}%</Text>
          </View>

          <PercentSlider
            value={draft.ai.confidenceThreshold}
            theme={theme}
            onChange={value => updateDraft(next => { next.ai.confidenceThreshold = value; })}
          />
        </Section>

        <Section title="Data Management" theme={theme}>
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.danger }]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={[styles.deleteText, { color: theme.danger }]}>DELETE ALL LOCAL DATA</Text>
          </TouchableOpacity>

          <Text style={[styles.warningText, { color: theme.textMuted }]}>This action cannot be undone</Text>
        </Section>
      </ScrollView>

      <ChoiceModal config={choiceConfig} onClose={() => setChoiceConfig(null)} theme={theme} />

      <SaveConfirmationModal
        visible={saveConfirmVisible}
        onCancel={() => setSaveConfirmVisible(false)}
        onConfirm={confirmSave}
        theme={theme}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={() => {
          setDeleteModalVisible(false);
          console.log('DELETE ALL LOCAL DATA');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 78,
    alignItems: 'center',
  },
  saveText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  sectionWrap: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 18,
    paddingRight: 12,
  },
  rowValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'right',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 6,
  },
  toggleOption: {
    minWidth: 68,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  toggleText: {
    fontWeight: '700',
    fontSize: 16,
  },
  toggleActiveText: {
    color: '#000',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
  },
  profileGoal: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 17,
  },
  profileMeta: {
    marginTop: 4,
    fontSize: 15,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  aiValue: {
    color: '#000',
    backgroundColor: COLORS.accent,
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontWeight: '800',
  },
  sliderWrap: {
    paddingVertical: 18,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 999,
    justifyContent: 'center',
  },
  sliderFill: {
    height: 8,
    borderRadius: 999,
  },
  sliderThumb: {
    position: 'absolute',
    top: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  deleteButton: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontWeight: '800',
    fontSize: 15,
  },
  warningText: {
    marginTop: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '70%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceScroll: {
    maxHeight: 420,
  },
  choiceItem: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: {
    fontSize: 17,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: '#000',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  confirmCard: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
  },
  confirmTitle: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
  },
  confirmMessage: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 24,
  },
  cancelSaveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmSaveButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelSaveText: {
    fontWeight: '800',
    fontSize: 16,
  },
  confirmSaveText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
});
