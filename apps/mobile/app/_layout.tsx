import '../gesture-patch';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { syncDatabase } from '@/backend/sync/syncService';
import { restoreAuthToken } from '@/shared/services/apiClient';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Restore token from secure storage on app launch
    restoreAuthToken().catch(() => {});

    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        try {
          await syncDatabase();
        } catch (e: any) {
          // Sync failure is non-fatal — app continues normally
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return <Stack />;
}