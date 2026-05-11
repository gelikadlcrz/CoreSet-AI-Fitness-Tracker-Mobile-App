import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../database';
import { apiClient } from '../../shared/services/apiClient';

type TableChanges = {
  created: Record<string, unknown>[];
  updated: Record<string, unknown>[];
  deleted: string[];
};

type SyncChanges = Record<string, TableChanges>;

interface SyncPullResult {
  changes: SyncChanges;
  timestamp: number;
}

const TABLE_ID_MAP: Record<string, string> = {
  exercises: 'exercise_id',
  routines: 'routine_id',
  routine_exercises: 'routine_exercise_id',
  sessions: 'session_id',
  sets: 'set_id',
  reps: 'rep_id',
  body_metrics: 'metric_id',
};

function normalizePullRecord(record: Record<string, unknown>, pkColumn: string): Record<string, unknown> {
  const cloned = { ...record };
  const idValue = cloned[pkColumn];
  delete cloned[pkColumn];
  cloned.id = idValue;
  return cloned;
}

function denormalizePushRecord(record: Record<string, unknown>, pkColumn: string): Record<string, unknown> {
  const cloned = { ...record };
  const idValue = cloned.id;
  delete cloned.id;
  cloned[pkColumn] = idValue;
  return cloned;
}

export const syncDatabase = async (): Promise<void> => {
  await synchronize({
    database,

    pullChanges: async ({ lastPulledAt }) => {
      const url = `/api/sync?lastPulledAt=${lastPulledAt ?? 0}`;
      const result = await apiClient.get<SyncPullResult>(url);

      const rawChanges: SyncChanges = JSON.parse(JSON.stringify(result.changes));
      const normalizedChanges: SyncChanges = {};

      for (const [table, changes] of Object.entries(rawChanges)) {
        const pk = TABLE_ID_MAP[table];
        if (!pk) continue;

        normalizedChanges[table] = {
          created: changes.created.map((r) => normalizePullRecord({ ...r }, pk)),
          updated: changes.updated.map((r) => normalizePullRecord({ ...r }, pk)),
          deleted: [...changes.deleted],
        };
      }

      return {
        changes: normalizedChanges,
        timestamp: result.timestamp,
      };
    },

    pushChanges: async ({ changes, lastPulledAt }) => {
      const rawChanges = changes as SyncChanges;
      const denormalizedChanges: SyncChanges = {};

      for (const [table, tableChanges] of Object.entries(rawChanges)) {
        const pk = TABLE_ID_MAP[table];
        if (!pk) continue;

        denormalizedChanges[table] = {
          created: tableChanges.created.map((r) => denormalizePushRecord({ ...r }, pk)),
          updated: tableChanges.updated.map((r) => denormalizePushRecord({ ...r }, pk)),
          deleted: [...tableChanges.deleted],
        };
      }

      await apiClient.post<{ ok: boolean }>('/api/sync', {
        lastPulledAt: lastPulledAt ?? 0,
        changes: denormalizedChanges,
      });
    },

    sendCreatedAsUpdated: false,
  });
};
