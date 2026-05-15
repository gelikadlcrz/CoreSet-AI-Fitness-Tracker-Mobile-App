import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Routine extends Model {
  static table = 'routines';

  @field('remote_routine_id') remoteRoutineId!: string;
  @field('remote_user_id') remoteUserId!: string;
  @field('name') name!: string;
  @field('notes') notes!: string;
  @field('last_used_at') lastUsedAt!: number;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Routine;
