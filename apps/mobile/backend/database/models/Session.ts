import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Session extends Model {
  static table = 'sessions';

  @text('user_id')                     declare userId: string;
  @text('routine_id')                  declare routineId: string;
  @date('started_at')                  declare startedAt: Date;
  @date('ended_at')                    declare endedAt: Date;
  @field('total_reps')                 declare totalReps: number;
  @field('total_vl_with_displacement') declare totalVlWithDisplacement: number;
  @field('total_vl_traditional')       declare totalVlTraditional: number;
  @field('total_duration_s')           declare totalDurationS: number;
  @text('notes')                       declare notes: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}