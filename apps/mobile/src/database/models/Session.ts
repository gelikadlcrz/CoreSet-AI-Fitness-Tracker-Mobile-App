import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Session extends Model {
  static table = 'sessions';

  @field('remote_session_id') remoteSessionId!: string;
  @field('remote_user_id') remoteUserId!: string;
  @field('routine_id') routineId!: string;
  @field('name') name!: string;
  @field('started_at') startedAt!: number;
  @field('ended_at') endedAt!: number;
  @field('status') status!: string;
  @field('total_reps') totalReps!: number;
  @field('total_duration_seconds') totalDurationSeconds!: number;
  @field('notes') notes!: string;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Session;
