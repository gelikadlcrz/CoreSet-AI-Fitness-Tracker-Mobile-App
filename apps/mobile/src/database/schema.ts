import {
  appSchema,
  tableSchema,
} from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,

  tables: [
    tableSchema({
      name: 'exercises',

      columns: [
        {
          name: 'exercise_id',
          type: 'string',
        },

        {
          name: 'name',
          type: 'string',
        },

        {
          name: 'muscle_group',
          type: 'string',
        },

        {
          name: 'equipment',
          type: 'string',
          isOptional: true,
        },

        {
          name: 'notes',
          type: 'string',
          isOptional: true,
        },
      ],
    }),
  ],
});