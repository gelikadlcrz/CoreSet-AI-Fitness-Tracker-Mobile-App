import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class BodyStat extends Model {
  static table = 'body_stats';

  @field('remote_metric_id') remoteMetricId!: string;
  @field('remote_user_id') remoteUserId!: string;
  @field('logged_at') loggedAt!: number;
  @field('weight_kg') weightKg!: number;
  @field('height_cm') heightCm!: number;
  @field('body_fat_percent') bodyFatPercent!: number;
  @field('body_type') bodyType!: string;
  @field('notes') notes!: string;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default BodyStat;
