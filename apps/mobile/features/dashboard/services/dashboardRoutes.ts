export const DASHBOARD_ROUTES = {
  captureEmpty: {
    pathname: '/(tabs)/capture',
    params: {
      mode: 'empty',
    },
  },

  captureRoutine: (routineId: string) => ({
    pathname: '/(tabs)/capture',
    params: {
      mode: 'routine',
      routineId,
    },
  }),

  routines: '/(tabs)/library',
  analytics: '/(tabs)/analytics',
  profile: '/(tabs)/settings',
} as const;
