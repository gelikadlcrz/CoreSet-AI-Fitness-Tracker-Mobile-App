// Calls WatermelonDB's synchronize() pointed at your CoreSet API.
// Import and call `syncDatabase()` whenever you want to sync
// (on app foreground, after a workout, on a button press, etc.)

import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '../database';
import { apiClient } from '../../shared/services/apiClient';

// ── Types matching the API pull response ──────────────────────
interface SyncPullResult {
  changes: Record<
    string,
    {
      created: Record<string, unknown>[];
      updated: Record<string, unknown>[];
      deleted: string[];
    }
  >;
  timestamp: number;
}

interface SyncPushPayload {
  lastPulledAt: number;
  changes: Record<
    string,
    {
      created: Record<string, unknown>[];
      updated: Record<string, unknown>[];
      deleted: string[];
    }
  >;
}

// ── Column name mapping ───────────────────────────────────────
const TABLE_ID_MAP: Record<string, string> = {
  exercises: 'exercise_id',
  routines: 'routine_id',
  routine_exercises: 'routine_exercise_id',
  sessions: 'session_id',
  sets: 'set_id',
  reps: 'rep_id',
  body_metrics: 'metric_id',
};

function normalizePullRecord(
  record: Record<string, unknown>,
  pkColumn: string,
): Record<string, unknown> {
  const cloned = { ...record };

  // remove server PK
  const idValue = cloned[pkColumn];
  delete cloned[pkColumn];

  // assign WatermelonDB id
  cloned.id = idValue;

  return cloned;
}

function denormalizePushRecord(
  record: Record<string, unknown>,
  pkColumn: string,
): Record<string, unknown> {
  const cloned = { ...record };

  // remove WatermelonDB id
  const idValue = cloned.id;
  delete cloned.id;

  // restore server PK
  cloned[pkColumn] = idValue;

  return cloned;
}

// ── Main sync function ────────────────────────────────────────
export const syncDatabase = async (): Promise<void> => {
  try {
    console.log('==========================');
    console.log('SYNC BEGIN');
    console.log('==========================');

    await synchronize({
      database,

      // ── PULL: fetch changes from server ──────────────────────
      pullChanges: async ({ lastPulledAt }) => {
        console.log('--------------------------');
        console.log('PULL START');
        console.log('lastPulledAt:', lastPulledAt);

        const url = `/api/sync?lastPulledAt=${lastPulledAt ?? 0}`;

        console.log('REQUEST URL:', url);

        let result: SyncPullResult;

        try {
          result = await apiClient.get<SyncPullResult>(url);

          console.log('API REQUEST SUCCESS');
        } catch (apiError: any) {
          console.log('API REQUEST FAILED');
          console.log(apiError);
          console.log(apiError?.message);
          console.log(apiError?.response?.data);

          throw apiError;
        }

        console.log('RAW RESULT:');
        console.log(JSON.stringify(result, null, 2));

        // Deep clone API response
        // Prevents readonly mutation issues
        const rawChanges = JSON.parse(
          JSON.stringify(result.changes),
        );

        console.log('RAW CHANGES:');
        console.log(JSON.stringify(rawChanges, null, 2));

        // Inspect every table + record
        for (const [table, changes] of Object.entries(
          rawChanges as Record<
            string,
            {
              created: Record<string, unknown>[];
              updated: Record<string, unknown>[];
              deleted: string[];
            }
          >,
        )) {
          console.log('====================');
          console.log('TABLE:', table);

          changes.created.forEach((r, i) => {
            console.log(
              `CREATED ${table} ${i}`,
              Object.keys(r),
            );

            console.log(
              `CREATED ${table} ${i} FULL`,
              JSON.stringify(r, null, 2),
            );
          });

          changes.updated.forEach((r, i) => {
            console.log(
              `UPDATED ${table} ${i}`,
              Object.keys(r),
            );

            console.log(
              `UPDATED ${table} ${i} FULL`,
              JSON.stringify(r, null, 2),
            );
          });
        }

        const normalizedChanges: SyncPullResult['changes'] = {};

        for (const [table, changes] of Object.entries(
          rawChanges as Record<
            string,
            {
              created: Record<string, unknown>[];
              updated: Record<string, unknown>[];
              deleted: string[];
            }
          >,
        )) {
          const pk = TABLE_ID_MAP[table];

          console.log('NORMALIZING TABLE:', table);

          if (!pk) {
            console.log('NO PK MAPPING FOR TABLE:', table);
            continue;
          }

          normalizedChanges[table] = {
            created: changes.created.map(
              (r: Record<string, unknown>, index) => {
                console.log(
                  `NORMALIZE CREATED ${table} ${index}`,
                );

                return normalizePullRecord({ ...r }, pk);
              },
            ),

            updated: changes.updated.map(
              (r: Record<string, unknown>, index) => {
                console.log(
                  `NORMALIZE UPDATED ${table} ${index}`,
                );

                return normalizePullRecord({ ...r }, pk);
              },
            ),

            deleted: [...changes.deleted],
          };
        }

        console.log('NORMALIZED CHANGES:');
        console.log(
          JSON.stringify(normalizedChanges, null, 2),
        );

        console.log('PULL COMPLETE');

        return {
          changes: normalizedChanges,
          timestamp: result.timestamp,
        };
      },

      // ── PUSH: send local changes to server ───────────────────
      pushChanges: async ({ changes, lastPulledAt }) => {
        console.log('--------------------------');
        console.log('PUSH START');

        const denormalizedChanges: SyncPushPayload['changes'] = {};

        for (const [table, tableChanges] of Object.entries(
          changes as Record<
            string,
            {
              created: Record<string, unknown>[];
              updated: Record<string, unknown>[];
              deleted: string[];
            }
          >,
        )) {
          console.log('PUSH TABLE:', table);

          const pk = TABLE_ID_MAP[table];

          if (!pk) {
            console.log('NO PK FOR PUSH TABLE:', table);
            continue;
          }

          denormalizedChanges[table] = {
            created: tableChanges.created.map(
              (r: Record<string, unknown>) =>
                denormalizePushRecord({ ...r }, pk),
            ),

            updated: tableChanges.updated.map(
              (r: Record<string, unknown>) =>
                denormalizePushRecord({ ...r }, pk),
            ),

            deleted: [...tableChanges.deleted],
          };
        }

        console.log('PUSH PAYLOAD:');
        console.log(
          JSON.stringify(
            {
              lastPulledAt: lastPulledAt ?? 0,
              changes: denormalizedChanges,
            },
            null,
            2,
          ),
        );

        try {
          await apiClient.post<{ ok: boolean }>(
            '/api/sync',
            {
              lastPulledAt: lastPulledAt ?? 0,
              changes: denormalizedChanges,
            },
          );

          console.log('PUSH SUCCESS');
        } catch (pushError: any) {
          console.log('PUSH FAILED');
          console.log(pushError);
          console.log(pushError?.message);
          console.log(pushError?.response?.data);

          throw pushError;
        }
      },

      // Send _status and _changed columns to the server
      sendCreatedAsUpdated: false,
    });

    console.log('==========================');
    console.log('SYNC SUCCESS');
    console.log('==========================');
  } catch (e: any) {
    console.log('==========================');
    console.log('SYNC FAILED');
    console.log('==========================');

    console.log('ERROR OBJECT:');
    console.log(e);

    console.log('ERROR MESSAGE:');
    console.log(e?.message);

    console.log('ERROR STACK:');
    console.log(e?.stack);

    throw e;
  }
};