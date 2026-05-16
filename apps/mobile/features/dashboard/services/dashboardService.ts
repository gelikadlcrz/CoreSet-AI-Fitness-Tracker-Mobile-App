import { DEMO_USER_ID, mockDashboardDb } from '../mock/mockDashboardDb';
import { mapDashboardHome } from './dashboardMapper';
import type { DashboardDbSnapshot, DashboardHomeVM } from '../types/dashboard.types';

export type DashboardRepository = {
  getHomeSnapshot: (userId: string) => Promise<DashboardDbSnapshot>;
};

let repository: DashboardRepository = {
  async getHomeSnapshot() {
    return mockDashboardDb;
  },
};

export function setDashboardRepository(nextRepository: DashboardRepository) {
  repository = nextRepository;
}

export async function getDashboardHome(userId = DEMO_USER_ID): Promise<DashboardHomeVM> {
  const snapshot = await repository.getHomeSnapshot(userId);
  return mapDashboardHome(snapshot, userId);
}

export function createApiDashboardRepository(baseUrl: string): DashboardRepository {
  return {
    async getHomeSnapshot(userId: string) {
      const response = await fetch(`${baseUrl}/dashboard/home?userId=${encodeURIComponent(userId)}`);

      if (!response.ok) {
        throw new Error(`Dashboard request failed: ${response.status}`);
      }

      return response.json() as Promise<DashboardDbSnapshot>;
    },
  };
}
