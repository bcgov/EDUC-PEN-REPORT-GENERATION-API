import {EVENT_TYPES} from '../../src/constants/messaging';

export function getGeneratePenRequestBatchReportsEvent(): string {
  console.log('HEYTHERE');
  return '{' +
      '"eventType": "' + EVENT_TYPES.GENERATE_PEN_REQUEST_BATCH_REPORTS + '",' +
      '"sagaId": "1",' +
      '"replyTo": "replyTopic",' +
      '"eventPayload": {' +
      '"reportType": "PEN_REG_BATCH_RESPONSE_REPORT",' +
      '"reportExtension": "pdf",' +
      '"data": { "reportDate": "2021-03-01"}' +
      '}' +
      '}';
}
