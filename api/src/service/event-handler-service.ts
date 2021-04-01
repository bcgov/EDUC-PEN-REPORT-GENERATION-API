import {EVENT_OUTCOMES, EVENT_TYPES} from '../constants/messaging';
import {ReportGenerationService} from './report-generation-service';
import {Event} from '../struct/v1/event';
import logger from '../components/logger';
import {BatchReport} from '../struct/v1/batch/batch-report';
import {plainToClass} from 'class-transformer';

export class EventHandlerService {

  private readonly _reportGenerationService: ReportGenerationService;

  public constructor(reportGenerationService: ReportGenerationService) {
    this._reportGenerationService = reportGenerationService;
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
      const reportData: BatchReport = plainToClass(BatchReport, event.eventPayload);
      logger.debug(`EventPayload: ${event.eventPayload}`);
      logger.debug(`Report data from nats: ${JSON.stringify(reportData)}`);
      const generatedFileResponse = await this._reportGenerationService.generateReport(reportData);
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
