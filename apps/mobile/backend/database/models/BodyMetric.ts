import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class BodyMetric extends Model {
  static table = 'body_metrics';

  @text('user_id')        declare userId: string;
  @date('logged_date')    declare loggedDate: Date;
  @field('bodyweight_kg') declare bodyweightKg: number;
  @field('body_fat_pct')  declare bodyFatPct: number;
  @text('notes')          declare notes: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}