import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class RoutineExercise extends Model {
  static table = 'routine_exercises';

  @text('routine_id')      declare routineId: string;
  @text('exercise_id')     declare exerciseId: string;
  @field('sort_order')     declare sortOrder: number;
  @field('target_sets')    declare targetSets: number;
  @field('target_reps_min')declare targetRepsMin: number;
  @field('target_reps_max')declare targetRepsMax: number;
  @field('target_rpe')     declare targetRpe: number;
  @field('rest_interval_s')declare restIntervalS: number;
  @text('notes')           declare notes: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}