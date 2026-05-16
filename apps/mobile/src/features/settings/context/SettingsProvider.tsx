import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { COLORS } from '../../../../shared/theme';

import {
  DEFAULT_SETTINGS,
  getOrCreateSettings,
  savePreferencesOnly,
} from '../services/settingsService';

import type { SettingsDraft } from '../types/settings.types';

type ThemePalette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  divider: string;
  input: string;
  danger: string;
  success: string;
  warning: string;
  iconOlive: string;
  iconOrange: string;
  warmup: string;
  failure: string;
  dropset: string;
  inactive: string;
};

type SettingsContextValue = {
  settings: SettingsDraft;
  theme: ThemePalette;
  isLoading: boolean;
  refreshSettings: () => Promise<SettingsDraft>;
  setSettingsLocally: (settings: SettingsDraft) => void;
  applyPreferencesImmediately: (
    preferences: SettingsDraft['preferences'],
  ) => Promise<SettingsDraft>;
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
  accentMuted: COLORS.accent + '24',
  border: COLORS.border,
  divider: COLORS.divider,
  input: COLORS.input,
  danger: COLORS.danger,
  success: COLORS.success,
  warning: COLORS.warning,
  iconOlive: COLORS.iconOlive,
  iconOrange: COLORS.iconOrange,
  warmup: '#D88900',
  failure: '#9F0000',
  dropset: '#8A007A',
  inactive: COLORS.inactive,
};

const LIGHT_THEME: ThemePalette = {
  background: '#F7F5EF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0EEE6',
  surfaceTertiary: '#E8E4D9',
  text: '#111111',
  textSecondary: '#4F4F4F',
  textMuted: '#767676',
  // Light mode uses neon orange instead of olive/neon yellow for stronger contrast.
  accent: '#FF5A00',
  accentMuted: '#FFE1CF',
  border: '#D6D1C4',
  divider: '#E4DFD3',
  input: '#F8F4EC',
  danger: COLORS.danger,
  success: '#0F8F2F',
  warning: '#B77900',
  iconOlive: '#FFE1CF',
  iconOrange: '#FF5A00',
  warmup: '#D88900',
  failure: '#9F0000',
  dropset: '#8A007A',
  inactive: '#DED9CE',
};

function getPalette(settings: SettingsDraft): ThemePalette {
  return settings.preferences.theme === 'light' ? LIGHT_THEME : DARK_THEME;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsDraft>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const next = await getOrCreateSettings();
    setSettings(next);
    setIsLoading(false);
    return next;
  }, []);

  useEffect(() => {
    refreshSettings().catch(error => {
      console.log('Global settings load error', error);
      setIsLoading(false);
    });
  }, [refreshSettings]);

  const applyPreferencesImmediately = useCallback(
    async (preferences: SettingsDraft['preferences']) => {
      const next = await savePreferencesOnly(preferences);
      setSettings(next);
      return next;
    },
    [],
  );

  const value = useMemo(
    () => ({
      settings,
      theme: getPalette(settings),
      isLoading,
      refreshSettings,
      setSettingsLocally: setSettings,
      applyPreferencesImmediately,
    }),
    [settings, isLoading, refreshSettings, applyPreferencesImmediately],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside SettingsProvider');
  }

  return context;
}

export type { ThemePalette };
