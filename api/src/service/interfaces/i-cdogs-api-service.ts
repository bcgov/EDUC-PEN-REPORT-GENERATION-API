import {Report} from '../../struct/v1/report';
import {AxiosResponse} from 'axios';

export interface ICdogsApiService {
  uploadTemplate(templatePath: string): Promise<string>
  isReportTemplateCachedInCdogs(hashFromRedis: string): Promise<string>
  generateReportFromTemplateHash(templateHash: string, report: Report<any>, formatter?: string): Promise<AxiosResponse>
}
