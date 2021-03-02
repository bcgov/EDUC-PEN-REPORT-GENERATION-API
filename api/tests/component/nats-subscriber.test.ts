import {Event} from '../../src/struct/v1/event';
import {mocked} from 'ts-jest/utils';
import {CdogsApiService} from '../../src/service/cdogs-api-service';
import {ReportGenerationService} from '../../src/service/report-generation-service';
import {EventHandlerService} from '../../src/service/event-handler-service';
import {getGeneratePenRequestBatchReportsEvent} from '../helpers/helpers';

jest.mock('../../src/service/report-generation-service', () => {
  return {
    ReportGenerationService: jest.fn().mockImplementation(() => {
      return {
        instance: () => {
          return {};
        },
        generateReport: () => {
          return 'abc';
        },
      };
    }),
  };
});

jest.mock('../../src/service/cdogs-api-service', () => {
  return {
    CdogsApiService: jest.fn().mockImplementation(() => {
      return {
        uploadTemplate: () => {
          return 'hash';
        },
      };
    }),
  };
});
describe('test subscribe function', () => {

  beforeEach(() => {
    // MockedReportGenerationService.mockClear();
  });

  it('given GENERATE_PEN_REQUEST_BATCH_REPORTS event it should call generateReport and publish response correctly', async () => {
    const event: Event = JSON.parse(getGeneratePenRequestBatchReportsEvent());
    await EventHandlerService.instance.handleEvent(event);
    const mockedReport = mocked(CdogsApiService, true);
    const mockedRGS = mocked(ReportGenerationService, true);
    expect(mockedRGS).toHaveBeenCalledTimes(1);
    expect(mockedReport).toHaveBeenCalledTimes(1);
  });
});
