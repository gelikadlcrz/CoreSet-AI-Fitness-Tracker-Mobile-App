import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { migrations } from './migrations';

import Exercise from './models/Exercise';
import UserProfile from './models/UserProfile';
import BodyStat from './models/BodyStat';
import AppSetting from './models/AppSetting';
import Routine from './models/Routine';
import RoutineExercise from './models/RoutineExercise';
import Session from './models/Session';
import WorkoutSet from './models/WorkoutSet';
import Rep from './models/Rep';
import ExportHistory from './models/ExportHistory';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'coreset',
  jsi: true,
  onSetUpError: error => {
    console.log('WatermelonDB setup error', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Exercise,
    UserProfile,
    BodyStat,
    AppSetting,
    Routine,
    RoutineExercise,
    Session,
    WorkoutSet,
    Rep,
    ExportHistory,
  ],
});
