import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class WorkoutSession extends Model {
  static table = 'workout_sessions';

  @field('user_profile_id') userProfileId!: string;
  @field('title') title!: string;
  @field('status') status!: string;
  @field('started_at') startedAt!: number;
  @field('finished_at') finishedAt!: number;
}
