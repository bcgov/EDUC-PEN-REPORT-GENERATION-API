import {EVENT_OUTCOMES, EVENT_TYPES} from '../constants/messaging';
import {ReportGenerationService} from './report-generation-service';
import {Event} from '../struct/v1/event';
import logger from '../components/logger';

export class EventHandlerService {

  private static _instance: EventHandlerService;

  public static get instance(): EventHandlerService {
    if (!EventHandlerService._instance) {
      EventHandlerService._instance = new EventHandlerService();
    }
    return EventHandlerService._instance;
  }

  public async handleEvent(event: Event): Promise<Event | any> {
    try {
      switch (event.eventType) {
      case EVENT_TYPES.GENERATE_PEN_REQUEST_BATCH_REPORTS:
        return await this.handleGeneratePenRequestBatchReports(event);
      default:
        break;
      }
    } catch (e) {
      logger.error(e);
    }
  }

  public async handleGeneratePenRequestBatchReports(event: Event): Promise<Event> {
    try {
      const generatedFileResponse = await ReportGenerationService.instance.generateReport(event.eventPayload);
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
