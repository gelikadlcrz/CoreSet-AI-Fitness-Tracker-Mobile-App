import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class WorkoutExercise extends Model {
  static table = 'workout_exercises';

  @field('session_id') sessionId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('name') name!: string;
  @field('equipment') equipment!: string;
  @field('note') note!: string;
  @field('sort_order') sortOrder!: number;
}
