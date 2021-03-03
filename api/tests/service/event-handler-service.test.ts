import * as Helpers from '../helpers/helpers';
import {EventHandlerService} from '../../src/service/event-handler-service';
import {mocked} from 'ts-jest/utils';
import {Event} from '../../src/struct/v1/event';
import {ReportGenerationService} from '../../src/service/report-generation-service';

jest.mock('../../src/service/report-generation-service', () => {
  return {
    ReportGenerationService: jest.fn().mockImplementation(() => {
      return {
        generateReport: () => {
          return Helpers.getGeneratedReportResponse();
        },
      };
    }),
  };
});

describe('test subscribe function', () => {
  const MockedReportGenerationService = mocked(ReportGenerationService, true);
  beforeEach(() => {
    MockedReportGenerationService.mockClear();
  });

  it('given GENERATE_PEN_REQUEST_BATCH_REPORTS event it should call generateReport and publish response correctly', async () => {

    const event: Event = JSON.parse(Helpers.getGeneratePenRequestBatchReportsEvent());
    const eventHandlerService = new EventHandlerService(new ReportGenerationService());
    const response = await eventHandlerService.handleEvent(event);
    const responseEvent = JSON.parse(Helpers.getGeneratePenRequestBatchReportsResponseEvent());

    expect(MockedReportGenerationService).toHaveBeenCalledTimes(1);
    expect(response).toEqual(responseEvent);
  });
});
