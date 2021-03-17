import {Report} from '../report';
import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';
import {BatchReportData} from './batch-report-data';

export class BatchReport extends Report<BatchReportData> {

  @IsDefined()
  @Expose()
  public data: BatchReportData;
}
