import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Rep extends Model {
  static table = 'reps';

  @field('remote_rep_id') remoteRepId!: string;
  @field('set_id') setId!: string;
  @field('rep_number') repNumber!: number;
  @field('total_duration_seconds') totalDurationSeconds!: number;
  @field('eccentric_duration_seconds') eccentricDurationSeconds!: number;
  @field('concentric_duration_seconds') concentricDurationSeconds!: number;
  @field('displacement_m') displacementM!: number;
  @field('peak_angular_velocity') peakAngularVelocity!: number;
  @field('model_confidence') modelConfidence!: number;
  @field('flagged') flagged!: boolean;
  @field('timestamp') timestamp!: number;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Rep;
