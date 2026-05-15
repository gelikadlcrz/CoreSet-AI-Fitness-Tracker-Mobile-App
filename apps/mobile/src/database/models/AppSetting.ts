import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class AppSetting extends Model {
  static table = 'app_settings';

  @field('weight_unit') weightUnit!: string;
  @field('distance_unit') distanceUnit!: string;
  @field('theme') theme!: string;
  @field('sound_enabled') soundEnabled!: boolean;
  @field('haptics_enabled') hapticsEnabled!: boolean;
  @field('default_rest_seconds') defaultRestSeconds!: number;
  @field('warmup_rest_seconds') warmupRestSeconds!: number;
  @field('working_rest_seconds') workingRestSeconds!: number;
  @field('drop_rest_seconds') dropRestSeconds!: number;
  @field('failure_rest_seconds') failureRestSeconds!: number;
  @field('ai_confidence_threshold') aiConfidenceThreshold!: number;
  @field('ai_smoothing') aiSmoothing!: number;
  @field('ai_rep_sensitivity') aiRepSensitivity!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default AppSetting;
