import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';
import {BatchListItem} from './batch-list-item';

export class BatchReportUserMatchedListItem {
  @IsDefined()
  @Expose()
  public school: BatchListItem;

  @IsDefined()
  @Expose()
  public min: BatchListItem;
}
