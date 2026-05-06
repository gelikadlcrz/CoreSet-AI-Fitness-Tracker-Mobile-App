import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Exercise extends Model {
  static table = 'exercises';

  @text('name') name!: string;
  @text('primary_muscle') primaryMuscle!: string;
  @field('is_ai_tracked') isAiTracked!: boolean;
  @text('created_by_user') createdByUser?: string;
}