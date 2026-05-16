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

    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'user_profiles',
          columns: [
            { name: 'remote_user_id', type: 'string', isOptional: true },
            { name: 'auth_id', type: 'string', isOptional: true },
            { name: 'email', type: 'string', isOptional: true },
            { name: 'is_logged_in', type: 'boolean', isOptional: true },
            { name: 'last_login_at', type: 'number', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'body_stats',
          columns: [
            { name: 'remote_metric_id', type: 'string', isOptional: true },
            { name: 'remote_user_id', type: 'string', isOptional: true },
            { name: 'logged_at', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'exercises',
          columns: [
            { name: 'primary_muscle', type: 'string', isOptional: true },
            { name: 'secondary_muscles_json', type: 'string', isOptional: true },
            { name: 'equipment_type', type: 'string', isOptional: true },
            { name: 'movement_pattern', type: 'string', isOptional: true },
            { name: 'is_ai_tracked', type: 'boolean', isOptional: true },
            { name: 'ai_exercise_class', type: 'string', isOptional: true },
            { name: 'is_bodyweight', type: 'boolean', isOptional: true },
            { name: 'is_custom', type: 'boolean', isOptional: true },
            { name: 'thumbnail_url', type: 'string', isOptional: true },
            { name: 'demo_video_url', type: 'string', isOptional: true },
            { name: 'remote_created_by_user', type: 'string', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'routines',
          columns: [
            { name: 'remote_routine_id', type: 'string', isOptional: true },
            { name: 'remote_user_id', type: 'string', isOptional: true },
            { name: 'last_used_at', type: 'number', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'routine_exercises',
          columns: [
            { name: 'remote_routine_exercise_id', type: 'string', isOptional: true },
            { name: 'target_reps_min', type: 'number', isOptional: true },
            { name: 'target_reps_max', type: 'number', isOptional: true },
            { name: 'target_rpe', type: 'number', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'sessions',
          columns: [
            { name: 'remote_session_id', type: 'string', isOptional: true },
            { name: 'remote_user_id', type: 'string', isOptional: true },
            { name: 'total_reps', type: 'number', isOptional: true },
            { name: 'total_duration_seconds', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        addColumns({
          table: 'workout_sets',
          columns: [
            { name: 'remote_set_id', type: 'string', isOptional: true },
            { name: 'set_number', type: 'number', isOptional: true },
            { name: 'is_warmup', type: 'boolean', isOptional: true },
            { name: 'log_mode', type: 'string', isOptional: true },
            { name: 'model_confidence_avg', type: 'number', isOptional: true },
            { name: 'total_displacement_m', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'deleted_at', type: 'number', isOptional: true },
          ],
        }),

        createTable({
          name: 'reps',
          columns: [
            { name: 'remote_rep_id', type: 'string', isOptional: true },
            { name: 'set_id', type: 'string', isIndexed: true },
            { name: 'rep_number', type: 'number' },
            { name: 'total_duration_seconds', type: 'number', isOptional: true },
            { name: 'eccentric_duration_seconds', type: 'number', isOptional: true },
            { name: 'concentric_duration_seconds', type: 'number', isOptional: true },
            { name: 'displacement_m', type: 'number', isOptional: true },
            { name: 'peak_angular_velocity', type: 'number', isOptional: true },
            { name: 'model_confidence', type: 'number', isOptional: true },
            { name: 'flagged', type: 'boolean' },
            { name: 'timestamp', type: 'number' },
            { name: 'deleted_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),

        createTable({
          name: 'exports',
          columns: [
            { name: 'remote_export_id', type: 'string', isOptional: true },
            { name: 'remote_user_id', type: 'string', isOptional: true },
            { name: 'export_format', type: 'string' },
            { name: 'date_range_start', type: 'number' },
            { name: 'date_range_end', type: 'number' },
            { name: 'include_manual', type: 'boolean' },
            { name: 'include_rep_data', type: 'boolean' },
            { name: 'deleted_at', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'routine_exercises',
          columns: [
            { name: 'focus_metric', type: 'string', isOptional: true },
          ],
        }),
      ],
    },

  ],
});
