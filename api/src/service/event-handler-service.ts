import {EVENT_TYPES, EVENT_OUTCOMES} from '../constants/messaging';
import {Client} from 'nats';
import {ReportGenerationService} from './report-generation-service';
import {Event} from '../struct/v1/event';
import logger from '../components/logger';
import {plainToClass} from 'class-transformer';

export class EventHandlerService {

  private static _instance: EventHandlerService;

  public static get instance(): EventHandlerService {
    logger.info('HERE IT IS');
    if (!EventHandlerService._instance) {
      EventHandlerService._instance = new EventHandlerService();
    }
    return EventHandlerService._instance;
  }
  public async handleEvent(msg: JSON, subject: string, reply: string, nats: Client): Promise<void> {
    const event = plainToClass(Event, msg);
    switch (event.eventType) {
    case EVENT_TYPES.GENERATE_PEN_REQUEST_BATCH_REPORTS:
      const response: Event = await this.handleGeneratePenRequestBatchReports(event);
      nats.publish(reply, response);
      break;
    default:
      break;
    }
  }

  public async handleGeneratePenRequestBatchReports(event: Event): Promise<Event> {
    try {
      const reportService = new ReportGenerationService();
      const generatedFileResponse = await reportService.generateReport(event.eventPayload);
      logger.info('Received response status', generatedFileResponse?.status);
      logger.info('Received response headers', generatedFileResponse?.headers);
      const responseEvent = event;
      responseEvent.eventPayload = generatedFileResponse.data;
      responseEvent.eventOutcome = EVENT_OUTCOMES.ARCHIVE_PEN_REQUEST_BATCH_REPORTS_GENERATED;
      return responseEvent;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}
