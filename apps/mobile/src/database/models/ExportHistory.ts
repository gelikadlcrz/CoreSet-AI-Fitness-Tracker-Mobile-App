import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

class ExportHistory extends Model {
  static table = 'exports';

  @field('remote_export_id') remoteExportId!: string;
  @field('remote_user_id') remoteUserId!: string;
  @field('export_format') exportFormat!: string;
  @field('date_range_start') dateRangeStart!: number;
  @field('date_range_end') dateRangeEnd!: number;
  @field('include_manual') includeManual!: boolean;
  @field('include_rep_data') includeRepData!: boolean;
  @field('deleted_at') deletedAt!: number;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}

export default ExportHistory;
