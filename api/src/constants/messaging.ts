export const TOPICS = ['PEN_REPORT_GENERATION_API_TOPIC'];
export const EVENTS_QUEUE = 'pen-report-generation-api-queue';

export enum EVENT_TYPES {
  GENERATE_PEN_REQUEST_BATCH_REPORTS = 'GENERATE_PEN_REQUEST_BATCH_REPORTS',
}

export enum EVENT_OUTCOMES {
  ARCHIVE_PEN_REQUEST_BATCH_REPORTS_GENERATED = 'ARCHIVE_PEN_REQUEST_BATCH_REPORTS_GENERATED',
}
