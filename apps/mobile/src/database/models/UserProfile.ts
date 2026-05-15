import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class UserProfile extends Model {
  static table = 'user_profiles';

  @field('remote_user_id') remoteUserId!: string;
  @field('auth_id') authId!: string;
  @field('email') email!: string;
  @field('is_logged_in') isLoggedIn!: boolean;
  @field('display_name') displayName!: string;
  @field('goal') goal!: string;
  @field('level') level!: string;
  @field('gender') gender!: string;
  @field('age') age!: number;
  @field('photo_uri') photoUri!: string;
  @field('last_login_at') lastLoginAt!: number;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default UserProfile;
