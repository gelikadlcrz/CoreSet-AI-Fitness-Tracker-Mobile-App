import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class WorkoutSet extends Model {
  static table = 'workout_sets';

  @field('session_id') sessionId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('routine_exercise_id') routineExerciseId!: string;
  @field('set_order') setOrder!: number;
  @field('set_type') setType!: string;
  @field('previous_weight_kg') previousWeightKg!: number;
  @field('previous_reps') previousReps!: number;
  @field('weight_kg') weightKg!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe!: number;
  @field('rest_seconds') restSeconds!: number;
  @field('completed') completed!: boolean;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default WorkoutSet;
