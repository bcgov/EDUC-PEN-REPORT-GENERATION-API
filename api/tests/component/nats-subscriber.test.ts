import * as Helpers from '../helpers/helpers';
import {TOPICS} from '../../src/constants/messaging';
//import {mocked} from 'ts-jest/utils';
import logger from "../../src/components/logger";
// import {plainToClass} from "class-transformer";
// import {Report} from "../../src/struct/v1/report";

const MockedReportGenerationService = ReportGenerationService as jest.MockedClass<typeof ReportGenerationService>;

jest.mock('../../src/service/report-generation-service', () => {
  return {
    ReportGenerationService: jest.fn().mockImplementation(() => {
      return {
        instance: () => {
          ReportGenerationService._instance = new ReportGenerationService();
          return ReportGenerationService._instance;
        },
        generateReport: () => {
          return 'report oclock!';
        },
      };
    }),
  };
});

describe('test subscribe function', () => {

  beforeEach(() => {
    //MockedReportGenerationService.mockClear();
  });

  it('given GENERATE_PEN_REQUEST_BATCH_REPORTS event it should call generateReport and publish response correctly', () => {
    const nats = Helpers.getMockedNatsClient();
    logger.error("HERE");
    const mockedReport = mocked(ReportGenerationService, true);
    nats.publish(TOPICS[0], Helpers.getGeneratePenRequestBatchReportsEvent());

    expect(mockedReport).toHaveBeenCalledTimes(1);
  });
});
