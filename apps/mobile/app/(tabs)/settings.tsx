import { useEffect, useMemo, useState } from 'react';

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../shared/theme';

import SettingsSection from '../../src/features/settings/components/SettingsSection';
import SettingsRow from '../../src/features/settings/components/SettingsRow';
import TogglePill from '../../src/features/settings/components/TogglePill';
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

function setNestedDraft(
  draft: SettingsDraft,
  updater: (next: SettingsDraft) => void,
) {
  return JSON.parse(JSON.stringify(draft)) as SettingsDraft;
}

function ChoiceModal({
  config,
  onClose,
}: {
  config: ChoiceConfig | null;
  onClose: () => void;
}) {
  if (!config) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{config.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.choiceScroll} showsVerticalScrollIndicator={false}>
            {config.values.map(value => {
              const selected = value === config.selected;

              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.choiceItem, selected && styles.choiceItemSelected]}
                  onPress={() => {
                    config.onSelect(value);
                    onClose();
                  }}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
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

function SelectableRow({
  label,
  value,
  onPress,
  noBorder,
}: {
  label: string;
  value: string;
  onPress: () => void;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <SettingsRow label={label} value={value} noBorder={noBorder} />
    </TouchableOpacity>
  );
}

function ProfileSummary({ draft }: { draft: SettingsDraft }) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color={COLORS.textMuted} />
      </View>

      <View style={styles.profileTextWrap}>
        <Text style={styles.profileName}>{draft.profile.displayName}</Text>
        <Text style={styles.profileGoal}>{draft.profile.goal} Goal</Text>
        <Text style={styles.profileMeta}>{draft.profile.level}</Text>
        <Text style={styles.profileMeta}>
          {draft.profile.gender} • {draft.profile.age} yrs old
        </Text>
      </View>
    </View>
  );
}

function PercentSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
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
        style={styles.sliderTrack}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.sliderFill, { width: `${clamp(value)}%` }]} />
        <View
          style={[
            styles.sliderThumb,
            {
              left: width ? Math.max(0, Math.min(width - 28, (clamp(value) / 100) * width - 14)) : 0,
            },
          ]}
        >
          <Text style={styles.sliderValue}>{clamp(value)}%</Text>
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [choiceConfig, setChoiceConfig] = useState<ChoiceConfig | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Save');

  useEffect(() => {
    getOrCreateSettings()
      .then(settings => setDraft(settings))
      .catch(error => {
        console.log('Settings load error', error);
      });
  }, []);

  const openChoice = (config: ChoiceConfig) => setChoiceConfig(config);

  const updateDraft = (updater: (next: SettingsDraft) => void) => {
    setDraft(current => {
      const next = setNestedDraft(current, updater);
      updater(next);
      return next;
    });
  };

  const save = async () => {
    setSaveLabel('Saving');
    await saveSettings(draft);
    setSaveLabel('Saved');
    setTimeout(() => setSaveLabel('Save'), 1200);
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>

          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>

        <SettingsSection title="User Profile">
          <ProfileSummary draft={draft} />

          <SelectableRow
            label="Goal"
            value={draft.profile.goal}
            onPress={() =>
              openChoice({
                title: 'Choose Goal',
                values: GOALS,
                selected: draft.profile.goal,
                onSelect: value => updateDraft(next => { next.profile.goal = value; }),
              })
            }
          />

          <SelectableRow
            label="Training Level"
            value={draft.profile.level}
            onPress={() =>
              openChoice({
                title: 'Choose Level',
                values: LEVELS,
                selected: draft.profile.level,
                onSelect: value => updateDraft(next => { next.profile.level = value; }),
              })
            }
          />

          <SelectableRow
            label="Gender"
            value={draft.profile.gender}
            onPress={() =>
              openChoice({
                title: 'Choose Gender',
                values: GENDERS,
                selected: draft.profile.gender,
                onSelect: value => updateDraft(next => { next.profile.gender = value; }),
              })
            }
          />

          <SelectableRow
            label="Age"
            value={`${draft.profile.age}`}
            noBorder
            onPress={() =>
              openChoice({
                title: 'Choose Age',
                values: range(13, 80),
                selected: String(draft.profile.age),
                onSelect: value => updateDraft(next => { next.profile.age = Number(value); }),
              })
            }
          />
        </SettingsSection>

        <SettingsSection title="Body Stats">
          <SelectableRow
            label="Weight"
            value={`${draft.bodyStats.weightKg} kg`}
            onPress={() =>
              openChoice({
                title: 'Choose Weight',
                values: range(35, 180).map(value => `${value} kg`),
                selected: `${draft.bodyStats.weightKg} kg`,
                onSelect: value => updateDraft(next => { next.bodyStats.weightKg = Number(value.replace(' kg', '')); }),
              })
            }
          />

          <SelectableRow
            label="Height"
            value={`${draft.bodyStats.heightCm} cm`}
            onPress={() =>
              openChoice({
                title: 'Choose Height',
                values: range(130, 220).map(value => `${value} cm`),
                selected: `${draft.bodyStats.heightCm} cm`,
                onSelect: value => updateDraft(next => { next.bodyStats.heightCm = Number(value.replace(' cm', '')); }),
              })
            }
          />

          <SelectableRow
            label="Body Fat"
            value={`${draft.bodyStats.bodyFatPercent}%`}
            onPress={() =>
              openChoice({
                title: 'Choose Body Fat',
                values: range(5, 50).map(value => `${value}%`),
                selected: `${draft.bodyStats.bodyFatPercent}%`,
                onSelect: value => updateDraft(next => { next.bodyStats.bodyFatPercent = Number(value.replace('%', '')); }),
              })
            }
          />

          <SelectableRow
            label="Body Type"
            value={draft.bodyStats.bodyType}
            noBorder
            onPress={() =>
              openChoice({
                title: 'Choose Body Type',
                values: BODY_TYPES,
                selected: draft.bodyStats.bodyType,
                onSelect: value => updateDraft(next => { next.bodyStats.bodyType = value; }),
              })
            }
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow label="Weight Unit">
            <TogglePill
              leftLabel="kg"
              rightLabel="lbs"
              selected={draft.preferences.weightUnit === 'kg' ? 'left' : 'right'}
              onLeftPress={() => updateDraft(next => { next.preferences.weightUnit = 'kg'; })}
              onRightPress={() => updateDraft(next => { next.preferences.weightUnit = 'lbs'; })}
            />
          </SettingsRow>

          <SettingsRow label="Distance Unit">
            <TogglePill
              leftLabel="km"
              rightLabel="mi"
              selected={draft.preferences.distanceUnit === 'km' ? 'left' : 'right'}
              onLeftPress={() => updateDraft(next => { next.preferences.distanceUnit = 'km'; })}
              onRightPress={() => updateDraft(next => { next.preferences.distanceUnit = 'mi'; })}
            />
          </SettingsRow>

          <SettingsRow label="App Theme">
            <TogglePill
              leftLabel="Dark"
              rightLabel="Light"
              selected={draft.preferences.theme === 'dark' ? 'left' : 'right'}
              onLeftPress={() => updateDraft(next => { next.preferences.theme = 'dark'; })}
              onRightPress={() => updateDraft(next => { next.preferences.theme = 'light'; })}
            />
          </SettingsRow>

          <SettingsRow label="Sound">
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.soundEnabled ? 'left' : 'right'}
              onLeftPress={() => updateDraft(next => { next.preferences.soundEnabled = true; })}
              onRightPress={() => updateDraft(next => { next.preferences.soundEnabled = false; })}
            />
          </SettingsRow>

          <SettingsRow label="Haptics" noBorder>
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.hapticsEnabled ? 'left' : 'right'}
              onLeftPress={() => updateDraft(next => { next.preferences.hapticsEnabled = true; })}
              onRightPress={() => updateDraft(next => { next.preferences.hapticsEnabled = false; })}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Workout Defaults">
          {[
            ['Global Default Rest Interval', 'defaultRestSeconds'],
            ['Warm-up Set Rest', 'warmupRestSeconds'],
            ['Working Set Rest', 'workingRestSeconds'],
            ['Drop Set Rest', 'dropRestSeconds'],
            ['Failure Set Rest', 'failureRestSeconds'],
          ].map(([label, key], index, list) => (
            <SelectableRow
              key={key}
              label={label}
              value={formatRestTime(draft.workoutDefaults[key as keyof SettingsDraft['workoutDefaults']])}
              noBorder={index === list.length - 1}
              onPress={() =>
                openChoice({
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
        </SettingsSection>

        <SettingsSection title="AI Configuration">
          <View style={styles.aiHeaderRow}>
            <Text style={styles.sliderLabel}>Model Confidence Threshold</Text>
            <Text style={styles.aiValue}>{draft.ai.confidenceThreshold}%</Text>
          </View>

          <PercentSlider
            value={draft.ai.confidenceThreshold}
            onChange={value => updateDraft(next => { next.ai.confidenceThreshold = value; })}
          />
        </SettingsSection>

        <SettingsSection title="Data Management">
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.deleteText}>DELETE ALL LOCAL DATA</Text>
          </TouchableOpacity>

          <Text style={styles.warningText}>This action cannot be undone</Text>
        </SettingsSection>
      </ScrollView>

      <ChoiceModal config={choiceConfig} onClose={() => setChoiceConfig(null)} />

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
    backgroundColor: COLORS.background,
  },
  content: {
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    color: COLORS.text,
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.surfaceSecondary,
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
  },
  profileGoal: {
    marginTop: 4,
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 17,
  },
  profileMeta: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sliderLabel: {
    color: COLORS.text,
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
    backgroundColor: COLORS.border,
    justifyContent: 'center',
  },
  sliderFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.accent,
  },
  sliderThumb: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValue: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteText: {
    color: COLORS.danger,
    fontWeight: '800',
    fontSize: 15,
  },
  warningText: {
    color: COLORS.textMuted,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
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
    backgroundColor: COLORS.surfaceSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceItemSelected: {
    backgroundColor: COLORS.accent,
  },
  choiceText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: '#000',
  },
});
