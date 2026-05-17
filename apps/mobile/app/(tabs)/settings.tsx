import React, { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  logoutLocalUser,
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
  accent: '#FF6B00',
  border: '#C9CABC',
  divider: '#E1E1D8',
  input: '#F0F1E8',
  danger: COLORS.danger,
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

function decimalRange(start: number, end: number, step = 0.01) {
  const values: string[] = [];
  for (let value = start; value <= end + 0.0001; value += step) {
    values.push(value.toFixed(2));
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

function cmToInches(cm: number) {
  return Math.round(cm / 2.54);
}

function inchesToCm(inches: number) {
  return Math.round(inches * 2.54);
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

function getHeightLabel(draft: SettingsDraft) {
  if (draft.preferences.distanceUnit === 'in') {
    return `${cmToInches(draft.bodyStats.heightCm)} in`;
  }
  return `${(draft.bodyStats.heightCm / 100).toFixed(2)} m`;
}

function getHeightChoices(unit: SettingsDraft['preferences']['distanceUnit']) {
  if (unit === 'in') {
    return range(51, 87).map(value => `${value} in`);
  }
  return decimalRange(1.30, 2.20).map(value => `${value} m`);
}

function parseHeightToCm(value: string) {
  if (value.endsWith('in')) {
    return inchesToCm(Number(value.replace(' in', '')));
  }
  return Math.round(Number(value.replace(' m', '')) * 100);
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
            <TouchableOpacity onPress={onClose} style={[styles.modalClose, { backgroundColor: theme.surfaceSecondary }]}> 
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
                  <Text style={[styles.choiceText, { color: theme.text }, selected && styles.choiceTextSelected]}>
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
            <TouchableOpacity style={[styles.cancelSaveButton, { backgroundColor: theme.surfaceSecondary }]} onPress={onCancel}>
              <Text style={[styles.cancelSaveText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.confirmSaveButton, { backgroundColor: theme.accent }]} onPress={onConfirm}>
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
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
    <View style={[styles.row, { borderBottomColor: theme.divider }, noBorder && styles.noBorder]}>
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
        <Text style={[styles.toggleText, { color: theme.textMuted }, selected === 'left' && styles.toggleActiveText]}>
          {leftLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.toggleOption, selected === 'right' && { backgroundColor: theme.accent }]}
        onPress={onRightPress}
      >
        <Text style={[styles.toggleText, { color: theme.textMuted }, selected === 'right' && styles.toggleActiveText]}>
          {rightLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function ProfileSummary({
  draft,
  theme,
  onPickPhoto,
  onLogout,
}: {
  draft: SettingsDraft;
  theme: ThemePalette;
  onPickPhoto: () => void;
  onLogout: () => void;
}) {
  return (
    <View style={[styles.profileCard, { borderBottomColor: theme.divider }]}> 
      <TouchableOpacity style={[styles.avatar, { backgroundColor: theme.surfaceSecondary }]} onPress={onPickPhoto} activeOpacity={0.85}>
        {draft.profile.photoUri ? (
          <Image source={{ uri: draft.profile.photoUri }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="person-circle-outline" size={62} color={theme.textMuted} />
        )}
        <View style={[styles.avatarEditBadge, { backgroundColor: theme.accent }]}> 
          <Ionicons name="camera" size={13} color="#111111" />
        </View>
      </TouchableOpacity>

      <View style={styles.profileTextWrap}>
        <Text style={[styles.profileName, { color: theme.text }]}>{draft.profile.displayName}</Text>
        <Text style={[styles.profileGoal, { color: theme.accent }]}>{draft.profile.goal} Goal</Text>
        <Text style={[styles.profileMeta, { color: theme.textSecondary }]}>{draft.profile.level}</Text>
        <Text style={[styles.profileMeta, { color: theme.textSecondary }]}> 
          {draft.profile.gender} • {draft.profile.age} yrs old
        </Text>
        {!!draft.profile.email && (
          <Text style={[styles.profileMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {draft.profile.email}
          </Text>
        )}

        <View style={styles.profileButtonRow}>
          <TouchableOpacity style={[styles.profileMiniButton, { backgroundColor: theme.danger }]} onPress={onLogout}>
            <Text style={styles.profileLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SignedOutProfile({
  theme,
  authEmail,
  setAuthEmail,
  authName,
  setAuthName,
  onSignIn,
  onSignUp,
}: {
  theme: ThemePalette;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authName: string;
  setAuthName: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  return (
    <View style={styles.signedOutCard}>
      <View style={[styles.avatar, { backgroundColor: theme.surfaceSecondary, alignSelf: 'center' }]}> 
        <Ionicons name="person-circle-outline" size={64} color={theme.textMuted} />
      </View>

      <Text style={[styles.signedOutTitle, { color: theme.text }]}>No user logged in</Text>

      <TextInput
        value={authName}
        onChangeText={setAuthName}
        placeholder="Display name"
        placeholderTextColor={theme.textMuted}
        style={[styles.authInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
      />

      <TextInput
        value={authEmail}
        onChangeText={setAuthEmail}
        placeholder="Email"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.authInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
      />

      <View style={styles.authActions}>
        <TouchableOpacity style={[styles.authButton, { backgroundColor: theme.surfaceSecondary }]} onPress={onSignIn}>
          <Text style={[styles.authButtonText, { color: theme.text }]}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.authButton, { backgroundColor: theme.accent }]} onPress={onSignUp}>
          <Text style={styles.authButtonPrimaryText}>Sign Up</Text>
        </TouchableOpacity>
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
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderName, { color: theme.text }]}>Model Confidence Threshold</Text>
        <Text style={[styles.sliderPercent, { color: theme.accent }]}>{clamp(value)}%</Text>
      </View>

      <View style={[styles.sliderTrack, { backgroundColor: theme.border }]} onLayout={onLayout} {...panResponder.panHandlers}>
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

function SettingsContent() {
  const [draft, setDraft] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [choiceConfig, setChoiceConfig] = useState<ChoiceConfig | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [saveConfirmVisible, setSaveConfirmVisible] = useState(false);
  const [saveLabel, setSaveLabel] = useState('Save');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  const {
    settings: globalSettings,
    theme,
    refreshSettings,
    setSettingsLocally,
    applyPreferencesImmediately,
  } = useAppSettings();

  useEffect(() => {
    getOrCreateSettings()
      .then(settings => {
        setDraft(settings);
        setAuthEmail(settings.profile.email || '');
        setAuthName(settings.profile.displayName || '');
        setSettingsLocally(settings);
      })
      .catch(error => {
        console.log('Settings load error', error);
      });
  }, [setSettingsLocally]);

  useEffect(() => {
    setDraft(globalSettings);
    setAuthEmail(globalSettings.profile.email || '');
    setAuthName(globalSettings.profile.displayName || '');
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
      applyPreferencesImmediately(next.preferences).catch(error => console.log('Immediate preference save error', error));
      return next;
    });
  };

  const pickProfilePhoto = async () => {
    try {
      // Load ImagePicker only when the user taps the avatar. This prevents the
      // whole Settings tab from crashing when the native module is not present
      // in an older development build.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ImagePicker = require('expo-image-picker');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
        allowsEditing: false,
        quality: 0.75,
        exif: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const selectedUri = result.assets[0].uri;
        updateDraft(next => {
          next.profile.photoUri = selectedUri;
        });
      }
    } catch (error) {
      console.log('Profile photo picker error', error);
      Alert.alert(
        'Photo picker unavailable',
        'CoreSet could not open the photo picker. Rebuild the development app after installing expo-image-picker, then try again.',
      );
    }
  };

  const handleSignIn = async () => {
    const next = await signInLocalUser({ email: authEmail, displayName: authName });
    setDraft(next);
    setSettingsLocally(next);
    await refreshSettings();
    triggerHaptic(next.preferences.hapticsEnabled);
  };

  const handleSignUp = async () => {
    const next = await signUpLocalUser({ email: authEmail, displayName: authName });
    setDraft(next);
    setSettingsLocally(next);
    await refreshSettings();
    triggerHaptic(next.preferences.hapticsEnabled);
  };

  const handleLogout = () => {
    Alert.alert('Log out?', 'This will switch the Settings screen back to the signed-out state.', [
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

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.accent }]} onPress={() => setSaveConfirmVisible(true)}>
            <Text style={styles.saveText}>{saveLabel}</Text>
          </TouchableOpacity>
        </View>

        <Section title="User Profile" theme={theme}>
          {draft.profile.isLoggedIn ? (
            <>
              <ProfileSummary draft={draft} theme={theme} onPickPhoto={pickProfilePhoto} onLogout={handleLogout} />

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
                noBorder
                theme={theme}
                onPress={() =>
                  setChoiceConfig({
                    title: 'Choose Age',
                    values: range(13, 80),
                    selected: String(draft.profile.age),
                    onSelect: value => updateDraft(next => { next.profile.age = Number(value); }),
                  })
                }
              />
            </>
          ) : (
            <SignedOutProfile
              theme={theme}
              authEmail={authEmail}
              setAuthEmail={setAuthEmail}
              authName={authName}
              setAuthName={setAuthName}
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
            />
          )}
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
            value={getHeightLabel(draft)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Height',
                values: getHeightChoices(draft.preferences.distanceUnit),
                selected: getHeightLabel(draft),
                onSelect: value => updateDraft(next => { next.bodyStats.heightCm = parseHeightToCm(value); }),
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
            noBorder
            theme={theme}
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
              leftLabel="m"
              rightLabel="in"
              selected={draft.preferences.distanceUnit === 'm' ? 'left' : 'right'}
              theme={theme}
              onLeftPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'm'; })}
              onRightPress={() => updatePreferenceImmediately(next => { next.preferences.distanceUnit = 'in'; })}
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

          <Row label="Haptics" noBorder theme={theme}>
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
          <Row
            label="Global Default Rest Interval"
            value={formatRestTime(draft.workoutDefaults.defaultRestSeconds)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Default Rest',
                values: REST_OPTIONS.map(formatRestTime),
                selected: formatRestTime(draft.workoutDefaults.defaultRestSeconds),
                onSelect: value => updateDraft(next => { next.workoutDefaults.defaultRestSeconds = REST_OPTIONS.find(seconds => formatRestTime(seconds) === value) || 90; }),
              })
            }
          />

          <Row
            label="Warm-up Set Rest"
            value={formatRestTime(draft.workoutDefaults.warmupRestSeconds)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Warm-up Rest',
                values: REST_OPTIONS.map(formatRestTime),
                selected: formatRestTime(draft.workoutDefaults.warmupRestSeconds),
                onSelect: value => updateDraft(next => { next.workoutDefaults.warmupRestSeconds = REST_OPTIONS.find(seconds => formatRestTime(seconds) === value) || 90; }),
              })
            }
          />

          <Row
            label="Working Set Rest"
            value={formatRestTime(draft.workoutDefaults.workingRestSeconds)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Working Rest',
                values: REST_OPTIONS.map(formatRestTime),
                selected: formatRestTime(draft.workoutDefaults.workingRestSeconds),
                onSelect: value => updateDraft(next => { next.workoutDefaults.workingRestSeconds = REST_OPTIONS.find(seconds => formatRestTime(seconds) === value) || 180; }),
              })
            }
          />

          <Row
            label="Drop Set Rest"
            value={formatRestTime(draft.workoutDefaults.dropRestSeconds)}
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Drop Set Rest',
                values: REST_OPTIONS.map(formatRestTime),
                selected: formatRestTime(draft.workoutDefaults.dropRestSeconds),
                onSelect: value => updateDraft(next => { next.workoutDefaults.dropRestSeconds = REST_OPTIONS.find(seconds => formatRestTime(seconds) === value) || 90; }),
              })
            }
          />

          <Row
            label="Failure Set Rest"
            value={formatRestTime(draft.workoutDefaults.failureRestSeconds)}
            noBorder
            theme={theme}
            onPress={() =>
              setChoiceConfig({
                title: 'Choose Failure Rest',
                values: REST_OPTIONS.map(formatRestTime),
                selected: formatRestTime(draft.workoutDefaults.failureRestSeconds),
                onSelect: value => updateDraft(next => { next.workoutDefaults.failureRestSeconds = REST_OPTIONS.find(seconds => formatRestTime(seconds) === value) || 180; }),
              })
            }
          />
        </Section>

        <Section title="AI Configuration" theme={theme}>
          <PercentSlider
            value={draft.ai.confidenceThreshold}
            theme={theme}
            onChange={value => updateDraft(next => { next.ai.confidenceThreshold = value; })}
          />
        </Section>

        <Section title="Data Management" theme={theme}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
            <Text style={styles.deleteText}>DELETE ALL LOCAL DATA</Text>
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
          Alert.alert('Local data reset', 'The delete action is ready to be connected to the database reset service.');
        }}
      />
    </>
  );
}

class SettingsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { errorMessage: string | null }
> {
  state = { errorMessage: null };

  static getDerivedStateFromError(error: Error) {
    return { errorMessage: error?.message || 'Settings failed to load.' };
  }

  componentDidCatch(error: Error) {
    console.log('Settings screen render error', error);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <View style={styles.errorRoot}>
          <Ionicons name="warning-outline" size={42} color={COLORS.danger} />
          <Text style={styles.errorTitle}>Settings could not open</Text>
          <Text style={styles.errorMessage}>{this.state.errorMessage}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function SettingsScreen() {
  return (
    <SettingsErrorBoundary>
      <SettingsContent />
    </SettingsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 92,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  saveText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  row: {
    minHeight: 56,
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
  rowRight: {
    alignItems: 'flex-end',
  },
  rowValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
  },
  profileGoal: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
  },
  profileMeta: {
    marginTop: 2,
    fontSize: 14,
  },
  profileButtonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  profileMiniButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  profileMiniText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileLogoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  signedOutCard: {
    paddingVertical: 18,
  },
  signedOutTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  authInput: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  authActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  authButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  authButtonText: {
    fontWeight: '900',
  },
  authButtonPrimaryText: {
    color: '#000000',
    fontWeight: '900',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  toggleOption: {
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  toggleText: {
    fontWeight: '800',
    fontSize: 14,
  },
  toggleActiveText: {
    color: '#000000',
  },
  sliderWrap: {
    paddingVertical: 18,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderName: {
    fontSize: 15,
    fontWeight: '800',
  },
  sliderPercent: {
    fontSize: 15,
    fontWeight: '900',
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
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  deleteButton: {
    marginTop: 14,
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  warningText: {
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    maxHeight: '72%',
    borderRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
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
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: '#000000',
    fontWeight: '900',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  confirmCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  confirmTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
  },
  confirmMessage: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  cancelSaveButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelSaveText: {
    fontWeight: '900',
  },
  confirmSaveButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmSaveText: {
    color: '#000000',
    fontWeight: '900',
  },
});
