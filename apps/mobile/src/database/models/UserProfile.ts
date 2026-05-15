import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class UserProfile extends Model {
  static table = 'user_profiles';

  @field('display_name') displayName!: string;
  @field('goal') goal!: string;
  @field('level') level!: string;
  @field('gender') gender!: string;
  @field('age') age!: number;
  @field('photo_uri') photoUri!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default UserProfile;
