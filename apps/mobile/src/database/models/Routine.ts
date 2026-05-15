import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Routine extends Model {
  static table = 'routines';

  @field('name') name!: string;
  @field('notes') notes!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Routine;
