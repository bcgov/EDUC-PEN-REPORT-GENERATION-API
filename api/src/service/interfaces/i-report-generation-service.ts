import {Report} from '../../struct/v1/report';
import {AxiosResponse} from 'axios';

export interface IReportGenerationService {
  generateReport(report: Report<any>): Promise<AxiosResponse>
}
