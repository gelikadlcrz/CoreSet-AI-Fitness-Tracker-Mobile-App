import { database } from '../../../database';
import type { SettingsDraft } from '../types/settings.types';

const now = () => Date.now();


const GUEST_USER_IDS = new Set(['guest', 'local-demo-user', '']);

async function adoptLocalRecordsForUser(remoteUserId?: string) {
  if (!remoteUserId || GUEST_USER_IDS.has(remoteUserId)) return;

  const timestamp = now();
  const userOwnedTables = ['routines', 'sessions', 'body_stats', 'exports'];

  await database.write(async () => {
    for (const tableName of userOwnedTables) {
      const collection = database.collections.get(tableName);
      const records = await collection.query().fetch();

      for (const item of records as any[]) {
        const currentRemoteUserId = item.remoteUserId || '';
        const shouldAdopt = !currentRemoteUserId || GUEST_USER_IDS.has(currentRemoteUserId);

        if (shouldAdopt) {
          await item.update((record: any) => {
            record.remoteUserId = remoteUserId;
            record.updatedAt = timestamp;
          });
        }
      }
    }
  });
}

export function canSyncUserData(settings: SettingsDraft) {
  const userId = settings.profile.userId || '';
  return settings.profile.isLoggedIn && !!userId && !GUEST_USER_IDS.has(userId);
}

export function canPullPublicExerciseLibrary() {
  return true;
}

export const DEFAULT_SETTINGS: SettingsDraft = {
  profile: {
    isLoggedIn: false,
    userId: 'local-demo-user',
    authId: 'local-demo-auth',
    email: '',
    displayName: 'Demo User',
    goal: 'Hypertrophy',
    level: 'Intermediate',
    gender: 'Prefer not to say',
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
    distanceUnit: 'm',
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
  },
};

function normalizeDistanceUnit(value?: string): 'm' | 'in' {
  if (value === 'in' || value === 'inches' || value === 'mi') return 'in';
  return 'm';
}

function normalizeTheme(value?: string): 'dark' | 'light' {
  return value === 'light' ? 'light' : 'dark';
}

function toDraft(profile: any, bodyStats: any, settings: any): SettingsDraft {
  return {
    profile: {
      isLoggedIn: !!profile.isLoggedIn,
      userId: profile.remoteUserId || profile.userId || 'local-demo-user',
      authId: profile.authId || 'local-demo-auth',
      email: profile.email || '',
      displayName: profile.displayName || DEFAULT_SETTINGS.profile.displayName,
      goal: profile.goal || DEFAULT_SETTINGS.profile.goal,
      level: profile.level || DEFAULT_SETTINGS.profile.level,
      gender: profile.gender || DEFAULT_SETTINGS.profile.gender,
      age: profile.age || DEFAULT_SETTINGS.profile.age,
      photoUri: profile.photoUri || '',
    },
    bodyStats: {
      weightKg: bodyStats.weightKg || DEFAULT_SETTINGS.bodyStats.weightKg,
      heightCm: bodyStats.heightCm || DEFAULT_SETTINGS.bodyStats.heightCm,
      bodyFatPercent: bodyStats.bodyFatPercent || DEFAULT_SETTINGS.bodyStats.bodyFatPercent,
      bodyType: bodyStats.bodyType || DEFAULT_SETTINGS.bodyStats.bodyType,
    },
    preferences: {
      weightUnit: settings.weightUnit === 'lbs' ? 'lbs' : 'kg',
      distanceUnit: normalizeDistanceUnit(settings.distanceUnit),
      theme: normalizeTheme(settings.theme),
      soundEnabled: settings.soundEnabled !== false,
      hapticsEnabled: settings.hapticsEnabled !== false,
    },
    workoutDefaults: {
      defaultRestSeconds: settings.defaultRestSeconds || DEFAULT_SETTINGS.workoutDefaults.defaultRestSeconds,
      warmupRestSeconds: settings.warmupRestSeconds || DEFAULT_SETTINGS.workoutDefaults.warmupRestSeconds,
      workingRestSeconds: settings.workingRestSeconds || DEFAULT_SETTINGS.workoutDefaults.workingRestSeconds,
      dropRestSeconds: settings.dropRestSeconds || DEFAULT_SETTINGS.workoutDefaults.dropRestSeconds,
      failureRestSeconds: settings.failureRestSeconds || DEFAULT_SETTINGS.workoutDefaults.failureRestSeconds,
    },
    ai: {
      confidenceThreshold: settings.aiConfidenceThreshold || DEFAULT_SETTINGS.ai.confidenceThreshold,
    },
  };
}

export async function getOrCreateSettings(): Promise<SettingsDraft> {
  const profileCollection = database.collections.get('user_profiles');
  const bodyCollection = database.collections.get('body_stats');
  const settingsCollection = database.collections.get('app_settings');

  const [profile] = await profileCollection.query().fetch();
  const [bodyStats] = await bodyCollection.query().fetch();
  const [settings] = await settingsCollection.query().fetch();

  if (profile && bodyStats && settings) {
    const draft = toDraft(profile as any, bodyStats as any, settings as any);

    if (draft.preferences.distanceUnit !== (settings as any).distanceUnit) {
      await saveSettings(draft);
    }

    return draft;
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
        record.remoteUserId = draft.profile.userId || record.remoteUserId || 'local-demo-user';
        record.authId = draft.profile.authId || record.authId || 'local-demo-auth';
        record.email = draft.profile.email || '';
        record.isLoggedIn = draft.profile.isLoggedIn;
        record.displayName = draft.profile.displayName;
        record.goal = draft.profile.goal;
        record.level = draft.profile.level;
        record.gender = draft.profile.gender;
        record.age = draft.profile.age;
        record.photoUri = draft.profile.photoUri || '';
        record.lastLoginAt = draft.profile.isLoggedIn ? timestamp : record.lastLoginAt || 0;
        record.updatedAt = timestamp;
      });
    } else {
      await profileCollection.create((record: any) => {
        record.remoteUserId = draft.profile.userId || 'local-demo-user';
        record.authId = draft.profile.authId || 'local-demo-auth';
        record.email = draft.profile.email || '';
        record.isLoggedIn = draft.profile.isLoggedIn;
        record.displayName = draft.profile.displayName;
        record.goal = draft.profile.goal;
        record.level = draft.profile.level;
        record.gender = draft.profile.gender;
        record.age = draft.profile.age;
        record.photoUri = draft.profile.photoUri || '';
        record.lastLoginAt = draft.profile.isLoggedIn ? timestamp : 0;
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
        record.loggedAt = timestamp;
        record.updatedAt = timestamp;
      });
    } else {
      await bodyCollection.create((record: any) => {
        record.weightKg = draft.bodyStats.weightKg;
        record.heightCm = draft.bodyStats.heightCm;
        record.bodyFatPercent = draft.bodyStats.bodyFatPercent;
        record.bodyType = draft.bodyStats.bodyType;
        record.loggedAt = timestamp;
        record.notes = '';
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
        record.aiSmoothing = 0;
        record.aiRepSensitivity = 0;
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
        record.aiSmoothing = 0;
        record.aiRepSensitivity = 0;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    }
  });
}

export async function savePreferencesOnly(preferences: SettingsDraft['preferences']) {
  const draft = await getOrCreateSettings();
  draft.preferences = preferences;
  await saveSettings(draft);
  return draft;
}

export async function signInLocalUser(input?: { email?: string; displayName?: string }) {
  const draft = await getOrCreateSettings();
  draft.profile.isLoggedIn = true;
  draft.profile.email = input?.email || draft.profile.email || 'demo@coreset.local';
  draft.profile.displayName = input?.displayName || draft.profile.displayName || 'Demo User';
  draft.profile.authId = draft.profile.authId || 'local-demo-auth';
  draft.profile.userId = draft.profile.userId || 'local-demo-user';
  await saveSettings(draft);
  await adoptLocalRecordsForUser(draft.profile.userId);
  return draft;
}

export async function signUpLocalUser(input?: { email?: string; displayName?: string }) {
  const timestamp = now();
  const draft = await getOrCreateSettings();
  draft.profile.isLoggedIn = true;
  draft.profile.email = input?.email || `user-${timestamp}@coreset.local`;
  draft.profile.displayName = input?.displayName || 'CoreSet User';
  draft.profile.authId = `local-auth-${timestamp}`;
  draft.profile.userId = `local-user-${timestamp}`;
  await saveSettings(draft);
  await adoptLocalRecordsForUser(draft.profile.userId);
  return draft;
}

export async function logoutLocalUser() {
  const draft = await getOrCreateSettings();
  draft.profile.isLoggedIn = false;
  await saveSettings(draft);
  return draft;
}

export function formatRestTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}
