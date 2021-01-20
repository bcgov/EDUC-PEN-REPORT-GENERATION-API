import {REPORT_EXTENSION, REPORT_TYPE} from '../../config/report-type';
import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';

export class Report {
  @IsDefined()
  @Expose()
  public reportType: REPORT_TYPE;

  @IsDefined()
  @Expose()
  public reportExtension: REPORT_EXTENSION;

  @IsDefined()
  @Expose()
  public reportName: string;

  @IsDefined()
  @Expose()
  public data: Record<string, unknown>;
}
