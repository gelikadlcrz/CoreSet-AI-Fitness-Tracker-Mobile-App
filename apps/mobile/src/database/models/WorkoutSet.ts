import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class WorkoutSet extends Model {
  static table = 'workout_sets';

  @field('remote_set_id') remoteSetId!: string;
  @field('session_id') sessionId!: string;
  @field('exercise_id') exerciseId!: string;
  @field('routine_exercise_id') routineExerciseId!: string;
  @field('set_order') setOrder!: number;
  @field('set_type') setType!: string;
  @field('set_number') setNumber!: number;
  @field('is_warmup') isWarmup!: boolean;
  @field('log_mode') logMode!: string;
  @field('previous_weight_kg') previousWeightKg!: number;
  @field('previous_reps') previousReps!: number;
  @field('weight_kg') weightKg!: number;
  @field('reps') reps!: number;
  @field('rpe') rpe!: number;
  @field('rest_seconds') restSeconds!: number;
  @field('completed') completed!: boolean;
  @field('model_confidence_avg') modelConfidenceAvg!: number;
  @field('total_displacement_m') totalDisplacementM!: number;
  @field('notes') notes!: string;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default WorkoutSet;
