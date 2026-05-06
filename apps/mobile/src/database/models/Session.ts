import { Model } from '@nozbe/watermelondb';
import { date, text } from '@nozbe/watermelondb/decorators';

export default class Session extends Model {
  static table = 'sessions';

  @text('routine_id') routineId?: string;
  @date('started_at') startedAt!: Date;
  @date('ended_at') endedAt?: Date;
  @text('notes') notes?: string;
}