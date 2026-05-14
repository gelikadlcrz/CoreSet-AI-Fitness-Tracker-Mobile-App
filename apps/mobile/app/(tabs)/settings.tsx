import { useState } from 'react';

import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { COLORS } from '../../shared/theme';

import SettingsSection from '../../features/settings/components/SettingsSection';
import SettingsRow from '../../features/settings/components/SettingsRow';
import TogglePill from '../../features/settings/components/TogglePill';
import ProfileCard from '../../features/settings/components/ProfileCard';

export default function SettingsScreen() {
  const [weightUnit, setWeightUnit] =
    useState<'kg' | 'lbs'>('kg');

  const [distanceUnit, setDistanceUnit] =
    useState<'km' | 'mi'>('km');

  const [theme, setTheme] =
    useState<'dark' | 'light'>(
      'dark'
    );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Settings & Profile
        </Text>

        <TouchableOpacity
          style={styles.saveButton}
        >
          <Text style={styles.saveText}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <SettingsSection title="User Profile">
        <ProfileCard />
      </SettingsSection>

      <SettingsSection title="Body Stats">
        <SettingsRow
          label="Weight"
          value="75 kg"
        />

        <SettingsRow
          label="Height"
          value="175 cm"
        />

        <SettingsRow
          label="Body Fat"
          value="14%"
        />

        <SettingsRow
          label="Body Type"
          value="Ectomorph"
          noBorder
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow label="Weight Unit">
          <TogglePill
            leftLabel="kg"
            rightLabel="lbs"
            selected={
              weightUnit === 'kg'
                ? 'left'
                : 'right'
            }
            onLeftPress={() =>
              setWeightUnit('kg')
            }
            onRightPress={() =>
              setWeightUnit('lbs')
            }
          />
        </SettingsRow>

        <SettingsRow label="Distance Unit">
          <TogglePill
            leftLabel="km"
            rightLabel="mi"
            selected={
              distanceUnit === 'km'
                ? 'left'
                : 'right'
            }
            onLeftPress={() =>
              setDistanceUnit('km')
            }
            onRightPress={() =>
              setDistanceUnit('mi')
            }
          />
        </SettingsRow>

        <SettingsRow
          label="App Theme"
          noBorder
        >
          <TogglePill
            leftLabel="Dark"
            rightLabel="Light"
            selected={
              theme === 'dark'
                ? 'left'
                : 'right'
            }
            onLeftPress={() =>
              setTheme('dark')
            }
            onRightPress={() =>
              setTheme('light')
            }
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection title="Workout Defaults">
        <SettingsRow
          label="Global Default Rest Interval"
          value="01:30"
        />

        <SettingsRow
          label="Warm-up Set Rest"
          value="01:30"
        />

        <SettingsRow
          label="Working Set Rest"
          value="01:30"
        />

        <SettingsRow
          label="Drop Set Rest"
          value="01:30"
        />

        <SettingsRow
          label="Failure Set Rest"
          value="01:30"
          noBorder
        />
      </SettingsSection>

      <SettingsSection title="AI Configuration">
        <View>
          <Text
            style={styles.sliderLabel}
          >
            Model Confidence Threshold
          </Text>

          <View
            style={styles.sliderTrack}
          >
            <View
              style={styles.sliderFill}
            />

            <View
              style={styles.sliderThumb}
            >
              <Text
                style={
                  styles.sliderValue
                }
              >
                85%
              </Text>
            </View>
          </View>

          <Text
            style={
              styles.sliderDescription
            }
          >
            Lower values improve
            precision while higher
            values improve form
            strictness.
          </Text>
        </View>
      </SettingsSection>

      <SettingsSection title="Data Management">
        <TouchableOpacity
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>
            DELETE ALL LOCAL DATA
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.warningText}
        >
          This action cannot be
          undone
        </Text>
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  content: {
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',

    marginBottom: 28,
  },

  title: {
    color: COLORS.text,

    fontSize: 32,
    fontWeight: '800',
  },

  saveButton: {
    backgroundColor:
      COLORS.accent,

    paddingHorizontal: 18,
    paddingVertical: 10,

    borderRadius: 999,
  },

  saveText: {
    color: '#000',

    fontWeight: '800',
  },

  sliderLabel: {
    color: COLORS.text,

    fontSize: 16,
    fontWeight: '700',

    marginBottom: 20,
  },

  sliderTrack: {
    height: 8,

    borderRadius: 999,

    backgroundColor:
      COLORS.surfaceSecondary,

    justifyContent: 'center',
  },

  sliderFill: {
    width: '85%',
    height: 8,

    borderRadius: 999,

    backgroundColor:
      COLORS.accent,
  },

  sliderThumb: {
    position: 'absolute',

    right: '10%',

    backgroundColor:
      COLORS.accent,

    paddingHorizontal: 8,
    paddingVertical: 4,

    borderRadius: 999,
  },

  sliderValue: {
    color: '#000',

    fontWeight: '800',
    fontSize: 12,
  },

  sliderDescription: {
    color: COLORS.textMuted,

    marginTop: 16,

    lineHeight: 22,
  },

  deleteButton: {
    borderWidth: 1.5,
    borderColor:
      COLORS.danger,

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
});