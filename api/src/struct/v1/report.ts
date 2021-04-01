import {REPORT_TYPE} from '../../config/report-type';
import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';

export class Report<T> {
  @IsDefined()
  @Expose()
  public reportType: REPORT_TYPE;

  @IsDefined()
  @Expose()
  public reportExtension: string;

  @IsDefined()
  @Expose()
  public reportName: string;

  @IsDefined()
  @Expose()
  public data: T;
}
