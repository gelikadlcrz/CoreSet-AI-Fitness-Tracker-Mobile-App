import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class WorkoutSet extends Model {
  static table = 'sets';

  @text('session_id')           declare sessionId: string;
  @text('exercise_id')          declare exerciseId: string;
  @field('set_number')          declare setNumber: number;
  @field('is_warmup')           declare isWarmup: boolean;
  @text('log_mode')             declare logMode: string;
  @field('load_kg')             declare loadKg: number;
  @field('rep_count')           declare repCount: number;
  @field('rpe')                 declare rpe: number;
  @field('vl_with_displacement')declare vlWithDisplacement: number;
  @field('vl_traditional')      declare vlTraditional: number;
  @field('total_displacement_m')declare totalDisplacementM: number;
  @field('avg_rep_duration_s')  declare avgRepDurationS: number;
  @field('model_confidence_avg')declare modelConfidenceAvg: number;
  @field('estimated_1rm')       declare estimated1rm: number;
  @date('started_at')           declare startedAt: Date;
  @date('ended_at')             declare endedAt: Date;
  @text('notes')                declare notes: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}