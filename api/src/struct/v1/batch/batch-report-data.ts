import {BatchListItem} from './batch-list-item';
import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';

export class BatchReportData {

  @IsDefined()
  @Expose()
  public processDate: string;

  @IsDefined()
  @Expose()
  public processTime: string;
  @IsDefined()
  @Expose()
  public submissionNumber: string;

  @IsDefined()
  @Expose()
  public reportDate: string;

  @IsDefined()
  @Expose()
  public reviewer: string;

  @IsDefined()
  @Expose()
  public mincode: string;

  @IsDefined()
  @Expose()
  public schoolName: string;

  @IsDefined()
  @Expose()
  public penCordinatorEmail: string;

  @IsDefined()
  @Expose()
  public mailingAddress: string;

  @IsDefined()
  @Expose()
  public telephone: string;

  @IsDefined()
  @Expose()
  public fascimile: string;

  @IsDefined()
  @Expose()
  public pendingList: BatchListItem[];

  @IsDefined()
  @Expose()
  public newPenList: BatchListItem[];

  @IsDefined()
  @Expose()
  public sysMatchedList: BatchListItem[];

  @IsDefined()
  @Expose()
  public diffList: BatchListItem[];

  @IsDefined()
  @Expose()
  public confirmedList: BatchListItem[];
}
