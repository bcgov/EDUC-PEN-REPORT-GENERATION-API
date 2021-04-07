import {EVENT_OUTCOMES, EVENT_TYPES} from '../../src/constants/messaging';

export function getGeneratePenRequestBatchReportsEvent(): string {
  return '{' +
      '"eventType": "' + EVENT_TYPES.GENERATE_PEN_REQUEST_BATCH_REPORTS + '",' +
      '"eventOutcome": null,' +
      '"sagaId": "1",' +
      '"replyTo": "replyTopic",' +
      '"eventPayload": "{\\"reportType\\": \\"PEN_REG_BATCH_RESPONSE_REPORT\\",\\"reportExtension\\": \\"pdf\\",' +
      '\\"data\\": { \\"reportDate\\": \\"2021-03-01\\"}}"}';
}
export function getGeneratePenRequestBatchReportsResponseEvent(): string {
  return '{' +
      '"eventType": "' + EVENT_TYPES.GENERATE_PEN_REQUEST_BATCH_REPORTS + '",' +
      '"sagaId": "1",' +
      '"replyTo": "replyTopic",' +
      '"eventPayload": "' + getGeneratedReportResponse().data + '",' +
      '"eventOutcome": "' + EVENT_OUTCOMES.ARCHIVE_PEN_REQUEST_BATCH_REPORTS_GENERATED + '"' +
      '}';
}

export function getGeneratedReportResponse(): Record<string, string> {
  return {
    data: 'Here\'s your report yo',
  };
}
