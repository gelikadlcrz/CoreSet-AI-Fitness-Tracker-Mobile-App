import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'exercises',
          columns: [
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'user_profiles',
          columns: [
            { name: 'display_name', type: 'string' },
            { name: 'goal', type: 'string' },
            { name: 'level', type: 'string' },
            { name: 'gender', type: 'string' },
            { name: 'age', type: 'number' },
            { name: 'photo_uri', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'body_stats',
          columns: [
            { name: 'weight_kg', type: 'number' },
            { name: 'height_cm', type: 'number' },
            { name: 'body_fat_percent', type: 'number' },
            { name: 'body_type', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'app_settings',
          columns: [
            { name: 'weight_unit', type: 'string' },
            { name: 'distance_unit', type: 'string' },
            { name: 'theme', type: 'string' },
            { name: 'sound_enabled', type: 'boolean' },
            { name: 'haptics_enabled', type: 'boolean' },
            { name: 'default_rest_seconds', type: 'number' },
            { name: 'warmup_rest_seconds', type: 'number' },
            { name: 'working_rest_seconds', type: 'number' },
            { name: 'drop_rest_seconds', type: 'number' },
            { name: 'failure_rest_seconds', type: 'number' },
            { name: 'ai_confidence_threshold', type: 'number' },
            { name: 'ai_smoothing', type: 'number' },
            { name: 'ai_rep_sensitivity', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'routines',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'routine_exercises',
          columns: [
            { name: 'routine_id', type: 'string', isIndexed: true },
            { name: 'exercise_id', type: 'string', isIndexed: true },
            { name: 'sort_order', type: 'number' },
            { name: 'target_sets', type: 'number' },
            { name: 'target_reps', type: 'number' },
            { name: 'default_weight_kg', type: 'number' },
            { name: 'default_rest_seconds', type: 'number' },
            { name: 'note', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'sessions',
          columns: [
            { name: 'routine_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'started_at', type: 'number' },
            { name: 'ended_at', type: 'number', isOptional: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'workout_sets',
          columns: [
            { name: 'session_id', type: 'string', isIndexed: true },
            { name: 'exercise_id', type: 'string', isIndexed: true },
            { name: 'routine_exercise_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'set_order', type: 'number' },
            { name: 'set_type', type: 'string' },
            { name: 'previous_weight_kg', type: 'number', isOptional: true },
            { name: 'previous_reps', type: 'number', isOptional: true },
            { name: 'weight_kg', type: 'number', isOptional: true },
            { name: 'reps', type: 'number', isOptional: true },
            { name: 'rpe', type: 'number', isOptional: true },
            { name: 'rest_seconds', type: 'number' },
            { name: 'completed', type: 'boolean' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
