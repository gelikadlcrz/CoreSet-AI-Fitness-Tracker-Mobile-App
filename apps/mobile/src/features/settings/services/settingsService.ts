import { database } from '../../../database';
import type { SettingsDraft } from '../types/settings.types';

const now = () => Date.now();

export const DEFAULT_SETTINGS: SettingsDraft = {
  profile: {
    displayName: 'Demo User',
    goal: 'Hypertrophy',
    level: 'Intermediate',
    gender: 'Male',
    age: 21,
    photoUri: '',
  },

  bodyStats: {
    weightKg: 75,
    heightCm: 175,
    bodyFatPercent: 14,
    bodyType: 'Mesomorph',
  },

  preferences: {
    weightUnit: 'kg',
    distanceUnit: 'km',
    theme: 'dark',
    soundEnabled: true,
    hapticsEnabled: true,
  },

  workoutDefaults: {
    defaultRestSeconds: 90,
    warmupRestSeconds: 90,
    workingRestSeconds: 180,
    dropRestSeconds: 90,
    failureRestSeconds: 180,
  },

  ai: {
    confidenceThreshold: 85,
    smoothing: 60,
    repSensitivity: 70,
  },
};

function toDraft(profile: any, bodyStats: any, settings: any): SettingsDraft {
  return {
    profile: {
      displayName: profile.displayName,
      goal: profile.goal,
      level: profile.level,
      gender: profile.gender,
      age: profile.age,
      photoUri: profile.photoUri || '',
    },
    bodyStats: {
      weightKg: bodyStats.weightKg,
      heightCm: bodyStats.heightCm,
      bodyFatPercent: bodyStats.bodyFatPercent,
      bodyType: bodyStats.bodyType,
    },
    preferences: {
      weightUnit: settings.weightUnit,
      distanceUnit: settings.distanceUnit,
      theme: settings.theme,
      soundEnabled: settings.soundEnabled,
      hapticsEnabled: settings.hapticsEnabled,
    },
    workoutDefaults: {
      defaultRestSeconds: settings.defaultRestSeconds,
      warmupRestSeconds: settings.warmupRestSeconds,
      workingRestSeconds: settings.workingRestSeconds,
      dropRestSeconds: settings.dropRestSeconds,
      failureRestSeconds: settings.failureRestSeconds,
    },
    ai: {
      confidenceThreshold: settings.aiConfidenceThreshold,
      smoothing: settings.aiSmoothing,
      repSensitivity: settings.aiRepSensitivity,
    },
  };
}

export async function getOrCreateSettings(): Promise<SettingsDraft> {
  const profileCollection = database.collections.get('user_profiles');
  const bodyCollection = database.collections.get('body_stats');
  const settingsCollection = database.collections.get('app_settings');

  const existingProfile = await profileCollection.query().fetch();
  const existingBody = await bodyCollection.query().fetch();
  const existingSettings = await settingsCollection.query().fetch();

  if (existingProfile[0] && existingBody[0] && existingSettings[0]) {
    return toDraft(existingProfile[0] as any, existingBody[0] as any, existingSettings[0] as any);
  }

  await saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(draft: SettingsDraft) {
  await database.write(async () => {
    const profileCollection = database.collections.get('user_profiles');
    const bodyCollection = database.collections.get('body_stats');
    const settingsCollection = database.collections.get('app_settings');

    const [profile] = await profileCollection.query().fetch();
    const [bodyStats] = await bodyCollection.query().fetch();
    const [settings] = await settingsCollection.query().fetch();
    const timestamp = now();

    if (profile) {
      await (profile as any).update((record: any) => {
        record.displayName = draft.profile.displayName;
        record.goal = draft.profile.goal;
        record.level = draft.profile.level;
        record.gender = draft.profile.gender;
        record.age = draft.profile.age;
        record.photoUri = draft.profile.photoUri || '';
        record.updatedAt = timestamp;
      });
    } else {
      await profileCollection.create((record: any) => {
        record.displayName = draft.profile.displayName;
        record.goal = draft.profile.goal;
        record.level = draft.profile.level;
        record.gender = draft.profile.gender;
        record.age = draft.profile.age;
        record.photoUri = draft.profile.photoUri || '';
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }

    if (bodyStats) {
      await (bodyStats as any).update((record: any) => {
        record.weightKg = draft.bodyStats.weightKg;
        record.heightCm = draft.bodyStats.heightCm;
        record.bodyFatPercent = draft.bodyStats.bodyFatPercent;
        record.bodyType = draft.bodyStats.bodyType;
        record.updatedAt = timestamp;
      });
    } else {
      await bodyCollection.create((record: any) => {
        record.weightKg = draft.bodyStats.weightKg;
        record.heightCm = draft.bodyStats.heightCm;
        record.bodyFatPercent = draft.bodyStats.bodyFatPercent;
        record.bodyType = draft.bodyStats.bodyType;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }

    if (settings) {
      await (settings as any).update((record: any) => {
        record.weightUnit = draft.preferences.weightUnit;
        record.distanceUnit = draft.preferences.distanceUnit;
        record.theme = draft.preferences.theme;
        record.soundEnabled = draft.preferences.soundEnabled;
        record.hapticsEnabled = draft.preferences.hapticsEnabled;
        record.defaultRestSeconds = draft.workoutDefaults.defaultRestSeconds;
        record.warmupRestSeconds = draft.workoutDefaults.warmupRestSeconds;
        record.workingRestSeconds = draft.workoutDefaults.workingRestSeconds;
        record.dropRestSeconds = draft.workoutDefaults.dropRestSeconds;
        record.failureRestSeconds = draft.workoutDefaults.failureRestSeconds;
        record.aiConfidenceThreshold = draft.ai.confidenceThreshold;
        record.aiSmoothing = draft.ai.smoothing;
        record.aiRepSensitivity = draft.ai.repSensitivity;
        record.updatedAt = timestamp;
      });
    } else {
      await settingsCollection.create((record: any) => {
        record.weightUnit = draft.preferences.weightUnit;
        record.distanceUnit = draft.preferences.distanceUnit;
        record.theme = draft.preferences.theme;
        record.soundEnabled = draft.preferences.soundEnabled;
        record.hapticsEnabled = draft.preferences.hapticsEnabled;
        record.defaultRestSeconds = draft.workoutDefaults.defaultRestSeconds;
        record.warmupRestSeconds = draft.workoutDefaults.warmupRestSeconds;
        record.workingRestSeconds = draft.workoutDefaults.workingRestSeconds;
        record.dropRestSeconds = draft.workoutDefaults.dropRestSeconds;
        record.failureRestSeconds = draft.workoutDefaults.failureRestSeconds;
        record.aiConfidenceThreshold = draft.ai.confidenceThreshold;
        record.aiSmoothing = draft.ai.smoothing;
        record.aiRepSensitivity = draft.ai.repSensitivity;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
}

export function formatRestTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}
