import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Rep extends Model {
  static table = 'reps';

  @text('set_id')                  declare setId: string;
  @field('rep_number')             declare repNumber: number;
  @field('total_duration_s')       declare totalDurationS: number;
  @field('eccentric_duration_s')   declare eccentricDurationS: number;
  @field('concentric_duration_s')  declare concentricDurationS: number;
  @field('displacement_m')         declare displacementM: number;
  @field('peak_angular_velocity')  declare peakAngularVelocity: number;
  @field('model_confidence')       declare modelConfidence: number;
  @field('flagged')                declare flagged: boolean;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}