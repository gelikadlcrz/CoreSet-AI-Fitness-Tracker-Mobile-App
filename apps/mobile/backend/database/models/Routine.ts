import { Model } from '@nozbe/watermelondb';

import {
  text,
  date,
  readonly,
} from '@nozbe/watermelondb/decorators';

export class Routine extends Model {
  static table = 'routines';

  @text('user_id')
  declare userId: string;

  @text('name')
  declare name: string;

  @text('notes')
  declare notes: string;

  @date('last_used_at')
  declare lastUsedAt: Date;

  @readonly
  @date('created_at')
  declare createdAt: Date;

  @readonly
  @date('updated_at')
  declare updatedAt: Date;
}