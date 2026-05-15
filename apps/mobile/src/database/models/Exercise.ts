import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class Exercise extends Model {
  static table = 'exercises';

  @field('exercise_id') exerciseId!: string;
  @field('name') name!: string;
  @field('muscle_group') muscleGroup!: string;
  @field('equipment') equipment!: string;
  @field('notes') notes!: string;
  @field('primary_muscle') primaryMuscle!: string;
  @field('secondary_muscles_json') secondaryMusclesJson!: string;
  @field('equipment_type') equipmentType!: string;
  @field('movement_pattern') movementPattern!: string;
  @field('is_ai_tracked') isAiTracked!: boolean;
  @field('ai_exercise_class') aiExerciseClass!: string;
  @field('is_bodyweight') isBodyweight!: boolean;
  @field('is_custom') isCustom!: boolean;
  @field('thumbnail_url') thumbnailUrl!: string;
  @field('demo_video_url') demoVideoUrl!: string;
  @field('remote_created_by_user') remoteCreatedByUser!: string;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default Exercise;
