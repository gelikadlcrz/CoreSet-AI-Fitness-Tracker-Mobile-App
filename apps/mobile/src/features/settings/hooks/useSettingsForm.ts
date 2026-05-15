import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../database';

export type SettingsForm = {
  displayName: string;
  email: string;
  goal: string;
  level: string;
  sex: string;
  age: string;
  photoUri: string;
  isLoggedIn: boolean;
  weightKg: string;
  heightCm: string;
  bodyFatPct: string;
  bodyType: string;
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'mi';
  theme: 'dark' | 'light';
  globalRest: string;
  warmupRest: string;
  workingRest: string;
  dropRest: string;
  failureRest: string;
  confidence: number;
  formStrictness: number;
  repSensitivity: number;
};

export const DEFAULT_SETTINGS: SettingsForm = {
  displayName: 'Renzo',
  email: 'renzo@test.local',
  goal: 'Hypertrophy Goal',
  level: 'Intermediate',
  sex: 'Male',
  age: '21',
  photoUri: '',
  isLoggedIn: true,
  weightKg: '75',
  heightCm: '175',
  bodyFatPct: '14',
  bodyType: 'Ectomorph',
  weightUnit: 'kg',
  distanceUnit: 'km',
  theme: 'dark',
  globalRest: '03:00',
  warmupRest: '01:30',
  workingRest: '03:00',
  dropRest: '01:30',
  failureRest: '03:00',
  confidence: 85,
  formStrictness: 70,
  repSensitivity: 65,
};

const SETTING_KEYS = [
  'weightUnit',
  'distanceUnit',
  'theme',
  'globalRest',
  'warmupRest',
  'workingRest',
  'dropRest',
  'failureRest',
  'confidence',
  'formStrictness',
  'repSensitivity',
] as const;

export function useSettingsForm() {
  const [form, setForm] = useState<SettingsForm>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function ensureDefaults() {
    const profiles = database.collections.get('user_profiles');
    const metrics = database.collections.get('body_metrics');
    const settings = database.collections.get('app_settings');
    const now = Date.now();

    let profile = (await profiles.query().fetch())[0] as any;

    await database.write(async () => {
      if (!profile) {
        profile = await profiles.create((record: any) => {
          record.displayName = DEFAULT_SETTINGS.displayName;
          record.email = DEFAULT_SETTINGS.email;
          record.goal = DEFAULT_SETTINGS.goal;
          record.level = DEFAULT_SETTINGS.level;
          record.sex = DEFAULT_SETTINGS.sex;
          record.age = Number(DEFAULT_SETTINGS.age);
          record.photoUri = '';
          record.isLoggedIn = true;
          record.updatedAt = now;
        });
      }

      const metricRows = await metrics
        .query(Q.where('user_profile_id', profile.id))
        .fetch();

      if (!metricRows[0]) {
        await metrics.create((record: any) => {
          record.userProfileId = profile.id;
          record.weightKg = Number(DEFAULT_SETTINGS.weightKg);
          record.heightCm = Number(DEFAULT_SETTINGS.heightCm);
          record.bodyFatPct = Number(DEFAULT_SETTINGS.bodyFatPct);
          record.bodyType = DEFAULT_SETTINGS.bodyType;
          record.updatedAt = now;
        });
      }

      for (const key of SETTING_KEYS) {
        const rows = await settings
          .query(Q.where('user_profile_id', profile.id), Q.where('key', key))
          .fetch();

        if (!rows[0]) {
          await settings.create((record: any) => {
            record.userProfileId = profile.id;
            record.key = key;
            record.value = String(DEFAULT_SETTINGS[key]);
            record.updatedAt = now;
          });
        }
      }
    });

    return profile;
  }

  async function loadSettings() {
    try {
      const profile: any = await ensureDefaults();
      const metrics = database.collections.get('body_metrics');
      const settings = database.collections.get('app_settings');

      const metric: any = (
        await metrics.query(Q.where('user_profile_id', profile.id)).fetch()
      )[0];

      const settingRows = (await settings
        .query(Q.where('user_profile_id', profile.id))
        .fetch()) as any[];

      const settingMap = settingRows.reduce<Record<string, string>>((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      setForm({
        displayName: profile.displayName ?? DEFAULT_SETTINGS.displayName,
        email: profile.email ?? '',
        goal: profile.goal ?? DEFAULT_SETTINGS.goal,
        level: profile.level ?? DEFAULT_SETTINGS.level,
        sex: profile.sex ?? DEFAULT_SETTINGS.sex,
        age: String(profile.age ?? DEFAULT_SETTINGS.age),
        photoUri: profile.photoUri ?? '',
        isLoggedIn: Boolean(profile.isLoggedIn),
        weightKg: String(metric?.weightKg ?? DEFAULT_SETTINGS.weightKg),
        heightCm: String(metric?.heightCm ?? DEFAULT_SETTINGS.heightCm),
        bodyFatPct: String(metric?.bodyFatPct ?? DEFAULT_SETTINGS.bodyFatPct),
        bodyType: metric?.bodyType ?? DEFAULT_SETTINGS.bodyType,
        weightUnit: (settingMap.weightUnit as any) ?? DEFAULT_SETTINGS.weightUnit,
        distanceUnit: (settingMap.distanceUnit as any) ?? DEFAULT_SETTINGS.distanceUnit,
        theme: (settingMap.theme as any) ?? DEFAULT_SETTINGS.theme,
        globalRest: settingMap.globalRest ?? DEFAULT_SETTINGS.globalRest,
        warmupRest: settingMap.warmupRest ?? DEFAULT_SETTINGS.warmupRest,
        workingRest: settingMap.workingRest ?? DEFAULT_SETTINGS.workingRest,
        dropRest: settingMap.dropRest ?? DEFAULT_SETTINGS.dropRest,
        failureRest: settingMap.failureRest ?? DEFAULT_SETTINGS.failureRest,
        confidence: Number(settingMap.confidence ?? DEFAULT_SETTINGS.confidence),
        formStrictness: Number(settingMap.formStrictness ?? DEFAULT_SETTINGS.formStrictness),
        repSensitivity: Number(settingMap.repSensitivity ?? DEFAULT_SETTINGS.repSensitivity),
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(nextForm = form) {
    const now = Date.now();
    const profiles = database.collections.get('user_profiles');
    const metrics = database.collections.get('body_metrics');
    const settings = database.collections.get('app_settings');
    const profile: any = await ensureDefaults();

    await database.write(async () => {
      await profile.update((record: any) => {
        record.displayName = nextForm.displayName;
        record.email = nextForm.email;
        record.goal = nextForm.goal;
        record.level = nextForm.level;
        record.sex = nextForm.sex;
        record.age = Number(nextForm.age) || 0;
        record.photoUri = nextForm.photoUri;
        record.isLoggedIn = nextForm.isLoggedIn;
        record.updatedAt = now;
      });

      const metricRows = await metrics
        .query(Q.where('user_profile_id', profile.id))
        .fetch();

      if (metricRows[0]) {
        await metricRows[0].update((record: any) => {
          record.weightKg = Number(nextForm.weightKg) || 0;
          record.heightCm = Number(nextForm.heightCm) || 0;
          record.bodyFatPct = Number(nextForm.bodyFatPct) || 0;
          record.bodyType = nextForm.bodyType;
          record.updatedAt = now;
        });
      }

      for (const key of SETTING_KEYS) {
        const rows = await settings
          .query(Q.where('user_profile_id', profile.id), Q.where('key', key))
          .fetch();
        const value = String(nextForm[key]);

        if (rows[0]) {
          await rows[0].update((record: any) => {
            record.value = value;
            record.updatedAt = now;
          });
        } else {
          await settings.create((record: any) => {
            record.userProfileId = profile.id;
            record.key = key;
            record.value = value;
            record.updatedAt = now;
          });
        }
      }
    });

    setSavedAt(now);
  }

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function setLoggedIn(value: boolean) {
    const next = { ...form, isLoggedIn: value };
    setForm(next);
    await saveSettings(next);
  }

  return {
    form,
    loading,
    savedAt,
    update,
    saveSettings,
    setLoggedIn,
  };
}
