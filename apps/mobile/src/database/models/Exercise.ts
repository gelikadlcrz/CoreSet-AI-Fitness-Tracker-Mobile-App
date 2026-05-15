import {
  Model,
} from '@nozbe/watermelondb';

import {
  field,
} from '@nozbe/watermelondb/decorators';

class Exercise extends Model {
  static table = 'exercises';

  @field('exercise_id')
  exerciseId!: string;

  @field('name')
  name!: string;

  @field('muscle_group')
  muscleGroup!: string;

  @field('equipment')
  equipment!: string;

  @field('notes')
  notes!: string;
}

export default Exercise;