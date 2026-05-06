import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Set extends Model {
  static table = 'sets';

  @text('session_id') sessionId!: string;
  @text('exercise_id') exerciseId!: string;
  @field('set_number') setNumber!: number;
  @text('log_mode') logMode!: string;
  @field('load_kg') loadKg?: number;
  @field('rep_count') repCount?: number;
  @field('rpe') rpe?: number;
}