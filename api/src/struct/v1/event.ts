import { IsDefined } from 'class-validator';
import { Expose } from 'class-transformer';
import { EVENT_TYPES } from '../../constants/messaging';
import {Report} from './report';

export class Event {
  @IsDefined()
  @Expose()
  public eventType: EVENT_TYPES;

  @IsDefined()
  @Expose()
  public eventOutcome: string;

  @IsDefined()
  @Expose()
  public sagaId: string;

  @IsDefined()
  @Expose()
  public replyTo: string;

  @IsDefined()
  @Expose()
  public eventPayload: Report;
}
