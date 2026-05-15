import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class BodyMetric extends Model {
  static table = 'body_metrics';

  @field('user_profile_id') userProfileId!: string;
  @field('weight_kg') weightKg!: number;
  @field('height_cm') heightCm!: number;
  @field('body_fat_pct') bodyFatPct!: number;
  @field('body_type') bodyType!: string;
  @field('updated_at') updatedAt!: number;
}
