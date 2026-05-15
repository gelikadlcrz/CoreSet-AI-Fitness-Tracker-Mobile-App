import type { SettingsDraft } from '../../features/settings/types/settings.types';
import { canPullPublicExerciseLibrary, canSyncUserData } from '../../features/settings/services/settingsService';

export type SyncScope = 'public_exercises' | 'user_settings' | 'routines' | 'sessions' | 'workout_history';

export function canSyncScope(scope: SyncScope, settings: SettingsDraft) {
  if (scope === 'public_exercises') return canPullPublicExerciseLibrary();
  return canSyncUserData(settings);
}

export function getSyncBlockedMessage(scope: SyncScope) {
  if (scope === 'public_exercises') return '';

  return 'Sign in to sync your routines, workout history, settings, and progress online.';
}

export function shouldMergeLocalAndCloud(settings: SettingsDraft) {
  return canSyncUserData(settings);
}
