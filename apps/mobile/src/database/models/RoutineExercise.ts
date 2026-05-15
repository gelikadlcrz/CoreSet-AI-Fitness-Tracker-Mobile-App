import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class RoutineExercise extends Model {
  static table = 'routine_exercises';

  @field('remote_routine_exercise_id') remoteRoutineExerciseId!: string;
  @field('routine_id') routineId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('sort_order') sortOrder!: number;
  @field('target_sets') targetSets!: number;
  @field('target_reps') targetReps!: number;
  @field('target_reps_min') targetRepsMin!: number;
  @field('target_reps_max') targetRepsMax!: number;
  @field('target_rpe') targetRpe!: number;
  @field('default_weight_kg') defaultWeightKg!: number;
  @field('default_rest_seconds') defaultRestSeconds!: number;
  @field('note') note!: string;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default RoutineExercise;
