import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'exercises',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'primary_muscle', type: 'string' },
        { name: 'is_ai_tracked', type: 'boolean' },
        { name: 'created_by_user', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'sessions',
      columns: [
        { name: 'routine_id', type: 'string', isOptional: true },
        { name: 'started_at', type: 'number' }, // WatermelonDB stores dates as numbers (timestamps)
        { name: 'ended_at', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'sets',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true },
        { name: 'exercise_id', type: 'string', isIndexed: true },
        { name: 'set_number', type: 'number' },
        { name: 'log_mode', type: 'string' },
        { name: 'load_kg', type: 'number', isOptional: true },
        { name: 'rep_count', type: 'number', isOptional: true },
        { name: 'rpe', type: 'number', isOptional: true },
      ]
    }),
  ]
});