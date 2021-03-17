import fs from 'fs';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from '../components/logger';
import retry from 'async-retry';
import {constants} from 'http2';
import FormData from 'form-data';
import {Report} from '../struct/v1/report';
import {AxiosHelper} from '../helpers/AxiosHelper';
import {injectable} from 'inversify';
import {AuthHandler} from '../middleware/auth-handler';
import {ICdogsApiService} from './interfaces/i-cdogs-api-service';

@injectable()
export class CdogsApiService implements ICdogsApiService {

  private _axiosHelper: AxiosHelper;
  private _authHandler: AuthHandler;

  public constructor(axiosHelper: AxiosHelper, authHandler: AuthHandler) {
    this._axiosHelper = axiosHelper;
    this._authHandler = authHandler;
  }

  private static createPostBody(report: Report<any>): Record<string, unknown> {
    return {
      data: {
        ...report.data,
      },
      options: {
        'cacheReport': false,
        'convertTo': report.reportExtension.toString(),
        'overwrite': true,
        'reportName': report.reportName,
      },
    };
  }

  public async uploadTemplate(templatePath: string): Promise<string> {
    return await retry(async () => {
      const bodyFormData = new FormData();
      bodyFormData.append('template', fs.createReadStream(templatePath));
      const headers: any = {
        ...bodyFormData.getHeaders(),
      };
      const url = `${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template`;
      try {
        const uploadResponse: AxiosResponse = await this._axiosHelper.post(url, bodyFormData, headers);
        return uploadResponse?.headers['x-template-hash'];
      } catch (e) {
        // CDOGS API will respond like this if same file is uploaded, API will catch that and return the hash.
        const detail: string = e?.response?.data?.detail;
        if (detail && detail.includes('File already cached')) {
          return detail.substring(27, detail.length - 2);
        } else {
          logger.error(e);
          throw e;
        }
      }
    }, {
      retries: 5,
    });
  }

  public async isReportTemplateCachedInCdogs(hashFromRedis: string): Promise<string> {
    return await retry(async () => {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      const url = `${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${hashFromRedis}`;
      const response: AxiosResponse<string> = await this._axiosHelper.get(url, headers);
      if (response?.status === constants.HTTP_STATUS_OK) {
        return response?.headers['x-template-hash'];
      } else {
        throw new Error('No Template Hash from CDOGS API.');
      }
    }, {
      retries: 5,
    });
  }

  public async generateReportFromTemplateHash(templateHash: string, report: Report<any>, formatter?: string): Promise<AxiosResponse> {
    logger.silly(`generateReport called with  templateHash :: ${templateHash}, formatter::  ${formatter}`, report);
    return await retry(async () => {
      const cdogsApiToken = await this._authHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const reportBody = CdogsApiService.createPostBody(report);
      if (!!formatter) {
        reportBody.formatters = formatter;
      }
      logger.silly(`request to cdogs ${JSON.stringify(reportBody)}`);
      try {
        return await axios
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${templateHash}/render`, reportBody, config);
      } catch (err) {
        logger.error(err);
        throw err;
      }
    }, {
      retries: 3,
    });
  }
}
