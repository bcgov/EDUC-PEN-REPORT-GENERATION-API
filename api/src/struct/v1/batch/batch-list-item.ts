import {IsDefined} from 'class-validator';
import {Expose} from 'class-transformer';

export class BatchListItem {

  @IsDefined()
  @Expose()
  public pen: string;

  @IsDefined()
  @Expose()
  public surname: string;

  @Expose()
  public givenName: string;

  @Expose()
  public legalMiddleNames: string;

  @IsDefined()
  @Expose()
  public birthDate: string;

  @IsDefined()
  @Expose()
  public gender: string;

  @IsDefined()
  @Expose()
  public schoolID: string;

  @Expose()
  public usualName: string;

  @Expose()
  public reason: string;
}
