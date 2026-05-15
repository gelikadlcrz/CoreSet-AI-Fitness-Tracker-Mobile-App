import { Database } from '@nozbe/watermelondb';

import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';

import Exercise from './models/Exercise';

const adapter = new SQLiteAdapter({
  schema,

  dbName: 'coreset',

  jsi: true,

  onSetUpError: error => {
    console.log(error);
  },
});

export const database = new Database({
  adapter,

  modelClasses: [Exercise],
});