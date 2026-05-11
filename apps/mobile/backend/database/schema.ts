import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name',               type: 'string' },
        { name: 'primary_muscle',     type: 'string' },
        { name: 'secondary_muscles',  type: 'string',  isOptional: true },
        { name: 'equipment_type',     type: 'string',  isOptional: true },
        { name: 'movement_pattern',   type: 'string',  isOptional: true },
        { name: 'is_ai_tracked',      type: 'boolean' },
        { name: 'ai_exercise_class',  type: 'string',  isOptional: true },
        { name: 'is_bodyweight',      type: 'boolean' },
        { name: 'is_custom',          type: 'boolean' },
        { name: 'created_by_user',    type: 'string',  isOptional: true },
        { name: 'created_at',         type: 'number' },
        { name: 'updated_at',         type: 'number' },
      ],
    }),

    tableSchema({
      name: 'routines',
      columns: [
        { name: 'user_id',      type: 'string' },
        { name: 'name',         type: 'string' },
        { name: 'notes',        type: 'string',  isOptional: true },
        { name: 'last_used_at', type: 'number',  isOptional: true },
        { name: 'created_at',   type: 'number' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),

    tableSchema({
      name: 'routine_exercises',
      columns: [
        { name: 'routine_id',      type: 'string' },
        { name: 'exercise_id',     type: 'string' },
        { name: 'sort_order',      type: 'number' },
        { name: 'target_sets',     type: 'number',  isOptional: true },
        { name: 'target_reps_min', type: 'number',  isOptional: true },
        { name: 'target_reps_max', type: 'number',  isOptional: true },
        { name: 'target_rpe',      type: 'number',  isOptional: true },
        { name: 'rest_interval_s', type: 'number',  isOptional: true },
        { name: 'notes',           type: 'string',  isOptional: true },
        { name: 'created_at',      type: 'number' },
        { name: 'updated_at',      type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'user_id',                     type: 'string' },
        { name: 'routine_id',                  type: 'string',  isOptional: true },
        { name: 'started_at',                  type: 'number' },
        { name: 'ended_at',                    type: 'number',  isOptional: true },
        { name: 'total_reps',                  type: 'number',  isOptional: true },
        { name: 'total_vl_with_displacement',  type: 'number',  isOptional: true },
        { name: 'total_vl_traditional',        type: 'number',  isOptional: true },
        { name: 'total_duration_s',            type: 'number',  isOptional: true },
        { name: 'notes',                       type: 'string',  isOptional: true },
        { name: 'created_at',                  type: 'number' },
        { name: 'updated_at',                  type: 'number' },
      ],
    }),

    tableSchema({
      name: 'sets',
      columns: [
        { name: 'session_id',            type: 'string' },
        { name: 'exercise_id',           type: 'string' },
        { name: 'set_number',            type: 'number' },
        { name: 'is_warmup',             type: 'boolean' },
        { name: 'log_mode',              type: 'string' },
        { name: 'load_kg',               type: 'number',  isOptional: true },
        { name: 'rep_count',             type: 'number',  isOptional: true },
        { name: 'rpe',                   type: 'number',  isOptional: true },
        { name: 'vl_with_displacement',  type: 'number',  isOptional: true },
        { name: 'vl_traditional',        type: 'number',  isOptional: true },
        { name: 'total_displacement_m',  type: 'number',  isOptional: true },
        { name: 'avg_rep_duration_s',    type: 'number',  isOptional: true },
        { name: 'model_confidence_avg',  type: 'number',  isOptional: true },
        { name: 'estimated_1rm',         type: 'number',  isOptional: true },
        { name: 'started_at',            type: 'number',  isOptional: true },
        { name: 'ended_at',              type: 'number',  isOptional: true },
        { name: 'notes',                 type: 'string',  isOptional: true },
        { name: 'created_at',            type: 'number' },
        { name: 'updated_at',            type: 'number' },
      ],
    }),

    tableSchema({
      name: 'reps',
      columns: [
        { name: 'set_id',                 type: 'string' },
        { name: 'rep_number',             type: 'number' },
        { name: 'total_duration_s',       type: 'number',  isOptional: true },
        { name: 'eccentric_duration_s',   type: 'number',  isOptional: true },
        { name: 'concentric_duration_s',  type: 'number',  isOptional: true },
        { name: 'displacement_m',         type: 'number',  isOptional: true },
        { name: 'peak_angular_velocity',  type: 'number',  isOptional: true },
        { name: 'model_confidence',       type: 'number',  isOptional: true },
        { name: 'flagged',                type: 'boolean' },
        { name: 'created_at',             type: 'number' },
        { name: 'updated_at',             type: 'number' },
      ],
    }),

    tableSchema({
      name: 'body_metrics',
      columns: [
        { name: 'user_id',       type: 'string' },
        { name: 'logged_date',   type: 'number' },
        { name: 'bodyweight_kg', type: 'number',  isOptional: true },
        { name: 'body_fat_pct',  type: 'number',  isOptional: true },
        { name: 'notes',         type: 'string',  isOptional: true },
        { name: 'created_at',    type: 'number' },
        { name: 'updated_at',    type: 'number' },
      ],
    }),
  ],
});