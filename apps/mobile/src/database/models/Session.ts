import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Session extends Model {
  static table = 'sessions';

  @field('routine_id') routineId!: string;
  @field('name') name!: string;
  @field('started_at') startedAt!: number;
  @field('ended_at') endedAt!: number;
  @field('status') status!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Session;
