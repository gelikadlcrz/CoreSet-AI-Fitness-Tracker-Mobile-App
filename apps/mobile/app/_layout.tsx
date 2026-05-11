import '../gesture-patch';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { syncDatabase } from '@/backend/sync/syncService';

export default function RootLayout() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        console.log('[AppState] App came to foreground — syncing...');
        try {
          await syncDatabase();
          console.log('[AppState] Background sync complete');
        } catch (e: any) {
          console.log('[AppState] Background sync failed:', e.message);
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  return <Stack />;
}