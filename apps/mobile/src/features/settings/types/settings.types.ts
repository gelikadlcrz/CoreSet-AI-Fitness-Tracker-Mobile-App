export type WeightUnit = 'kg' | 'lbs';
export type DistanceUnit = 'km' | 'mi';
export type AppTheme = 'dark' | 'light';

export type SettingsDraft = {
  profile: {
    displayName: string;
    goal: string;
    level: string;
    gender: string;
    age: number;
    photoUri?: string;
  };

  bodyStats: {
    weightKg: number;
    heightCm: number;
    bodyFatPercent: number;
    bodyType: string;
  };

  preferences: {
    weightUnit: WeightUnit;
    distanceUnit: DistanceUnit;
    theme: AppTheme;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };

  workoutDefaults: {
    defaultRestSeconds: number;
    warmupRestSeconds: number;
    workingRestSeconds: number;
    dropRestSeconds: number;
    failureRestSeconds: number;
  };

  ai: {
    confidenceThreshold: number;
    smoothing: number;
    repSensitivity: number;
  };
};
