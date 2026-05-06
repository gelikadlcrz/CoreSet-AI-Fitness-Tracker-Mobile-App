import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema'; // This imports your index.ts from the schema folder

// Import Models
import Exercise from './models/Exercise';
import Session from './models/Session';
import Set from './models/Set';

// The Adapter connects Watermelon to the underlying SQLite engine
const adapter = new SQLiteAdapter({
  schema,
  jsi: true, /* JSI is a massive performance boost for React Native */
  onSetUpError: error => {
    console.error("Database failed to load:", error);
  }
});

// Create and export the database instance
export const database = new Database({
  adapter,
  modelClasses: [Exercise, Session, Set],
});