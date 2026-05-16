export const DASHBOARD_ROUTES = {
  captureEmpty: '/capture?mode=empty',
  captureRoutine: (routineId: string) => `/capture?mode=routine&routineId=${encodeURIComponent(routineId)}`,
  routines: '/routines',
  analytics: '/analytics',
  profile: '/settings',
} as const;
