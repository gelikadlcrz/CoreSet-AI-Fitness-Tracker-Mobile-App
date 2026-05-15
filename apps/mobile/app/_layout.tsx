import { Stack } from 'expo-router';

import { SettingsProvider } from '../src/features/settings/context/SettingsProvider';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SettingsProvider>
  );
}
