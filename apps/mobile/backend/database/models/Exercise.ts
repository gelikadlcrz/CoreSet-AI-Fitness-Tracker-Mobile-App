import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export class Exercise extends Model {
  static table = 'exercises';

  @text('name')             declare name: string;
  @text('primary_muscle')   declare primaryMuscle: string;
  @text('secondary_muscles')declare secondaryMuscles: string;
  @text('equipment_type')   declare equipmentType: string;
  @text('movement_pattern') declare movementPattern: string;
  @field('is_ai_tracked')   declare isAiTracked: boolean;
  @text('ai_exercise_class')declare aiExerciseClass: string;
  @field('is_bodyweight')   declare isBodyweight: boolean;
  @field('is_custom')       declare isCustom: boolean;
  @text('created_by_user')  declare createdByUser: string;

  @readonly @date('created_at') declare createdAt: Date;
  @readonly @date('updated_at') declare updatedAt: Date;
}