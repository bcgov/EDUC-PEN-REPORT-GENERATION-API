import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';

export class BatchListItem {

  @IsDefined()
  @Expose()
  public pen: string;

  @Expose()
  public penDiff: string;

  @IsDefined()
  @Expose()
  public surname: string;

  @Expose()
  public surnameDiff: string;

  @Expose()
  public givenName: string;

  @Expose()
  public givenNameDiff: string;

  @Expose()
  public legalMiddleNames: string;

  @Expose()
  public legalMiddleNamesDiff: string;

  @IsDefined()
  @Expose()
  public birthDate: string;

  @Expose()
  public birthDateDiff: string;

  @Expose()
  public gender: string;

  @Expose()
  public genderDiff: string;

  @Expose()
  public schoolID: string;

  @Expose()
  public schoolIDDiff: string;

  @Expose()
  public usualName: string;

  @Expose()
  public reason: string;
}
