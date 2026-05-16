import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardViewModel } from '../types/dashboard.types';
import { getDashboardHome } from '../services/dashboardService';
import { DASHBOARD_ROUTES } from '../services/dashboardRoutes';

type UseDashboardResult = {
  data: DashboardViewModel | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startEmptySession: () => void;
  startRoutineSession: (routineId: string) => void;
  openProfile: () => void;
  seeAllRoutines: () => void;
  viewAllActivity: () => void;
};

export function useDashboard(userId = 'demo_user_001'): UseDashboardResult {
  const router = useRouter();
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const dashboard = await getDashboardHome(userId);
      setData(dashboard);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Unable to load dashboard.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      refresh,
      startEmptySession: () => router.push(DASHBOARD_ROUTES.activeWorkout as any),
      startRoutineSession: (routineId: string) => router.push(DASHBOARD_ROUTES.routineWorkout(routineId) as any),
      openProfile: () => router.push(DASHBOARD_ROUTES.profile as any),
      seeAllRoutines: () => router.push(DASHBOARD_ROUTES.routines as any),
      viewAllActivity: () => router.push(DASHBOARD_ROUTES.activity as any),
    }),
    [data, error, isLoading, refresh, router],
  );
}
