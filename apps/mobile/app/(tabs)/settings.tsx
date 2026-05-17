import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
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

import {
  DEFAULT_SETTINGS,
  formatRestTime,
  getOrCreateSettings,
  logoutLocalUser,
  savePreferencesOnly,
  saveSettings,
  signInLocalUser,
  signUpLocalUser,
} from '../../src/features/settings/services/settingsService';

import { useAppSettings } from '../../src/features/settings/hooks/useAppSettings';
import type { SettingsDraft } from '../../src/features/settings/types/settings.types';

type ChoiceConfig = {
  title: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
};

const GOALS = ['General Fitness', 'Hypertrophy', 'Strength', 'Fat Loss', 'Endurance', 'Mobility'];
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

function triggerHaptic(enabled: boolean) {
  if (enabled) {
    Vibration.vibrate(8);
  }
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: any;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
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
  onPress,
  noBorder,
  theme,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  noBorder?: boolean;
  theme: any;
}) {
  const content = (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: theme.divider,
        },
        noBorder && styles.noBorder,
      ]}
    >
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>

      {children ?? (
        <View style={styles.rowValueWrap}>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={1}>
            {value}
          </Text>
          {!!onPress && <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />}
        </View>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
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
  theme: any;
}) {
  return (
    <View style={[styles.toggleWrap, { backgroundColor: theme.input }]}>
      <TouchableOpacity
        style={[
          styles.toggleOption,
          selected === 'left' && { backgroundColor: theme.accent },
        ]}
        onPress={onLeftPress}
      >
        <Text
          style={[
            styles.toggleText,
            { color: selected === 'left' ? '#000000' : theme.textMuted },
          ]}
        >
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleOption,
          selected === 'right' && { backgroundColor: theme.accent },
        ]}
        onPress={onRightPress}
      >
        <Text
          style={[
            styles.toggleText,
            { color: selected === 'right' ? '#000000' : theme.textMuted },
          ]}
        >
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ChoiceModal({
  config,
  onClose,
  theme,
}: {
  config: ChoiceConfig | null;
  onClose: () => void;
  theme: any;
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
                    { backgroundColor: selected ? theme.accent : theme.surfaceSecondary },
                  ]}
                  onPress={() => {
                    config.onSelect(value);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      { color: selected ? '#000000' : theme.text },
                    ]}
                  >
                    {value}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={20} color="#000000" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PercentSlider({
  value,
  onChange,
  theme,
}: {
  value: number;
  onChange: (value: number) => void;
  theme: any;
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
        <View
          style={[
            styles.sliderFill,
            {
              width: `${clamp(value)}%`,
              backgroundColor: theme.accent,
            },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            {
              backgroundColor: theme.accent,
              left: width
                ? Math.max(0, Math.min(width - 22, (clamp(value) / 100) * width - 11))
                : 0,
            },
          ]}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const {
    settings: globalSettings,
    theme,
    refreshSettings,
    setSettingsLocally,
    applyPreferencesImmediately,
  } = useAppSettings();

  const [draft, setDraft] = useState<SettingsDraft>(globalSettings ?? DEFAULT_SETTINGS);
  const [choiceConfig, setChoiceConfig] = useState<ChoiceConfig | null>(null);
  const [saveConfirmVisible, setSaveConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Save');

  useEffect(() => {
    getOrCreateSettings()
      .then(settings => {
        setDraft(settings);
        setSettingsLocally(settings);
      })
      .catch(error => {
        console.log('Settings load error', error);
      });
  }, [setSettingsLocally]);

  useEffect(() => {
    setDraft(globalSettings);
  }, [globalSettings]);

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

      applyPreferencesImmediately(next.preferences).catch(error => {
        console.log('Immediate preference save error', error);
      });

      return next;
    });
  };

  const pickProfilePhoto = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
        allowsEditing: false,
        quality: 0.75,
        exif: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        updateDraft(next => {
          next.profile.photoUri = result.assets[0].uri;
        });
      }
    } catch (error) {
      console.log('Profile photo picker error', error);
      Alert.alert(
        'Photo picker unavailable',
        'CoreSet could not open the photo picker. Rebuild the development app after installing expo-image-picker.',
      );
    }
  };

  const handleSignIn = async () => {
    const next = await signInLocalUser({
      email: draft.profile.email || 'demo@coreset.local',
      displayName: draft.profile.displayName || 'Demo User',
    });

    setDraft(next);
    setSettingsLocally(next);
    await refreshSettings();
  };

  const handleSignUp = async () => {
    const next = await signUpLocalUser({
      email: draft.profile.email || 'demo@coreset.local',
      displayName: draft.profile.displayName || 'Demo User',
    });

    setDraft(next);
    setSettingsLocally(next);
    await refreshSettings();
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'This will return Settings to the signed-out state.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          const next = await logoutLocalUser();
          setDraft(next);
          setSettingsLocally(next);
          await refreshSettings();
        },
      },
    ]);
  };

  const confirmSave = async () => {
    setSaveConfirmVisible(false);
    setSaveLabel('Saving');

    try {
      await saveSettings(draft);
      setSettingsLocally(draft);
      await refreshSettings();
      triggerHaptic(draft.preferences.hapticsEnabled);
      setSaveLabel('Saved');
      setTimeout(() => setSaveLabel('Save'), 1200);
    } catch (error) {
      console.log('Settings save error', error);
      setSaveLabel('Retry');
    }
  };

  const displayDistance = draft.preferences.distanceUnit === 'in' ? 'in' : 'm';

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }]}
            onPress={() => setSaveConfirmVisible(true)}
          >
            <Text style={styles.saveText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>

        <Section title="User Profile" theme={theme}>
          {draft.profile.isLoggedIn ? (
            <>
              <View style={[styles.profileCard, { borderBottomColor: theme.divider }]}>
                <TouchableOpacity
                  style={[styles.avatar, { backgroundColor: theme.surfaceSecondary }]}
                  onPress={pickProfilePhoto}
                >
                  <Ionicons name="person" size={40} color={theme.textMuted} />
                  <View style={[styles.avatarBadge, { backgroundColor: theme.accent }]}>
                    <Ionicons name="camera" size={13} color="#000000" />
                  </View>
                </TouchableOpacity>

                <View style={styles.profileTextWrap}>
                  <Text style={[styles.profileName, { color: theme.text }]}>
                    {draft.profile.displayName || 'Demo User'}
                  </Text>
                  <Text style={[styles.profileGoal, { color: theme.accent }]}>
                    {draft.profile.goal} Goal
                  </Text>
                  <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>
                    {draft.profile.level}
                  </Text>
                  <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>
                    {draft.profile.gender} • {draft.profile.age} yrs old
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={[styles.logoutText, { color: theme.danger }]}>Log Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.signedOutCard}>
              <View style={[styles.avatarLarge, { backgroundColor: theme.surfaceSecondary }]}>
                <Ionicons name="person" size={44} color={theme.textMuted} />
              </View>

              <Text style={[styles.signedOutTitle, { color: theme.text }]}>No user signed in</Text>
              <Text style={[styles.signedOutText, { color: theme.textMuted }]}>
                Continue locally or use a demo account for testing.
              </Text>

              <View style={styles.authRow}>
                <TouchableOpacity
                  style={[styles.authButton, { backgroundColor: theme.accent }]}
                  onPress={handleSignIn}
                >
                  <Text style={styles.authButtonText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.authButtonSecondary, { borderColor: theme.border }]}
                  onPress={handleSignUp}
                >
                  <Text style={[styles.authButtonSecondaryText, { color: theme.text }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

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
            value={`${draft.bodyStats.weightKg} kg`}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Weight',
                values: range(35, 180).map(value => `${value} kg`),
                selected: `${draft.bodyStats.weightKg} kg`,
                onSelect: value => updateDraft(next => { next.bodyStats.weightKg = Number(value.replace(' kg', '')); }),
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
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.weightUnit = 'kg'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.weightUnit = 'lbs'; })}
              theme={theme}
            />
          </Row>

          <Row label="Distance Unit" theme={theme}>
            <TogglePill
              leftLabel="m"
              rightLabel="in"
              selected={displayDistance === 'm' ? 'left' : 'right'}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'm'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'in'; })}
              theme={theme}
            />
          </Row>

          <Row label="App Theme" theme={theme}>
            <TogglePill
              leftLabel="Dark"
              rightLabel="Light"
              selected={draft.preferences.theme === 'dark' ? 'left' : 'right'}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.theme = 'dark'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.theme = 'light'; })}
              theme={theme}
            />
          </Row>

          <Row label="Sound" theme={theme}>
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.soundEnabled ? 'left' : 'right'}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.soundEnabled = true; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.soundEnabled = false; })}
              theme={theme}
            />
          </Row>

          <Row label="Haptics" theme={theme} noBorder>
            <TogglePill
              leftLabel="On"
              rightLabel="Off"
              selected={draft.preferences.hapticsEnabled ? 'left' : 'right'}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.hapticsEnabled = true; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.hapticsEnabled = false; })}
              theme={theme}
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
                      next.workoutDefaults[key as keyof SettingsDraft['workoutDefaults']] =
                        minutes * 60 + seconds;
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
            <Text style={[styles.aiValue, { backgroundColor: theme.accent }]}>
              {draft.ai.confidenceThreshold}%
            </Text>
          </View>

          <PercentSlider
            value={draft.ai.confidenceThreshold}
            onChange={value => updateDraft(next => { next.ai.confidenceThreshold = value; })}
            theme={theme}
          />
        </Section>

        <Section title="Data Management" theme={theme}>
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.danger }]}
            onPress={() => setDeleteConfirmVisible(true)}
          >
            <Text style={[styles.deleteText, { color: theme.danger }]}>DELETE ALL LOCAL DATA</Text>
          </TouchableOpacity>

          <Text style={[styles.warningText, { color: theme.textMuted }]}>This action cannot be undone</Text>
        </Section>
      </ScrollView>

      <ChoiceModal config={choiceConfig} onClose={() => setChoiceConfig(null)} theme={theme} />

      <Modal transparent visible={saveConfirmVisible} animationType="fade">
        <Pressable style={styles.confirmOverlay} onPress={() => setSaveConfirmVisible(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Save settings?</Text>
            <Text style={[styles.confirmMessage, { color: theme.textMuted }]}>
              This will save your profile, body stats, workout defaults, and AI configuration locally.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButtonSecondary, { borderColor: theme.border }]}
                onPress={() => setSaveConfirmVisible(false)}
              >
                <Text style={[styles.confirmButtonSecondaryText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButtonPrimary, { backgroundColor: theme.accent }]}
                onPress={confirmSave}
              >
                <Text style={styles.confirmButtonPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={deleteConfirmVisible} animationType="fade">
        <Pressable style={styles.confirmOverlay} onPress={() => setDeleteConfirmVisible(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.confirmTitle, { color: theme.text }]}>Delete local data?</Text>
            <Text style={[styles.confirmMessage, { color: theme.textMuted }]}>
              This action is not fully connected yet. Keep this option disabled until the database reset service is finalized.
            </Text>

            <TouchableOpacity
              style={[styles.confirmButtonSecondary, { borderColor: theme.border, marginTop: 16 }]}
              onPress={() => setDeleteConfirmVisible(false)}
            >
              <Text style={[styles.confirmButtonSecondaryText, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 18,
    paddingBottom: 94,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
  },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  saveText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionWrap: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 9,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  row: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingRight: 12,
  },
  rowValueWrap: {
    maxWidth: '52%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  toggleWrap: {
    width: 116,
    height: 34,
    borderRadius: 999,
    flexDirection: 'row',
    padding: 3,
  },
  toggleOption: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '900',
  },
  profileCard: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLarge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 14,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    fontSize: 21,
    fontWeight: '900',
  },
  profileGoal: {
    marginTop: 4,
    fontWeight: '800',
    fontSize: 15,
  },
  profileMeta: {
    marginTop: 3,
    fontSize: 13,
  },
  logoutButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '900',
  },
  signedOutCard: {
    paddingVertical: 8,
  },
  signedOutTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
  },
  signedOutText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  authRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
  },
  authButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  authButtonSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    paddingRight: 12,
  },
  aiValue: {
    color: '#000000',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontWeight: '900',
  },
  sliderWrap: {
    paddingTop: 16,
    paddingBottom: 20,
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
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 14,
  },
  deleteText: {
    fontWeight: '900',
    fontSize: 14,
  },
  warningText: {
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '72%',
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
    fontWeight: '900',
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
    fontSize: 16,
    fontWeight: '800',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    borderRadius: 24,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  confirmMessage: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmButtonSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonSecondaryText: {
    fontSize: 14,
    fontWeight: '900',
  },
  confirmButtonPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});