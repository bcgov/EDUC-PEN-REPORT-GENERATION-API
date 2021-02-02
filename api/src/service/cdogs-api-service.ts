import fs from 'fs';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {AuthHandler} from '../middleware/auth-handler';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from '../components/logger';
import retry from 'async-retry';
import {constants} from 'http2';
import FormData from 'form-data';
import {Report} from '../struct/v1/report';

export class CdogsApiService {

  public static async uploadTemplate(templatePath: string): Promise<string> {
    let templateHash = '';
    await retry(async () => {
      try {
        const bodyFormData = new FormData();
        bodyFormData.append('template', fs.createReadStream(templatePath, {encoding: 'base64'}));
        const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
        const config: AxiosRequestConfig = {
          headers: {
            ...bodyFormData.getHeaders(),
            'Authorization': `Bearer ${cdogsApiToken}`,
          },
        };

        const response: AxiosResponse = await axios.create(config)
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template`, bodyFormData);

        if (response?.status === constants.HTTP_STATUS_OK) {
          templateHash = response?.headers['X-Template-Hash'];
        }
      } catch (e) {
        // CDOGS API will respond like this if same file is uploaded, API will catch that and return the template hash.
        const detail: string = e?.response?.data?.detail;
        if (detail && detail.includes('File already cached')) {
          templateHash = detail.substring(27, detail.length - 2);
        } else {
          logger.error(e);
          throw e;
        }
      }
    }, {
      retries: 5,
    });
    return templateHash;
  }

  public static async isReportTemplateCachedInCdogs(hashFromRedis: string): Promise<boolean> {
    await retry(async () => {
      const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const response: AxiosResponse = await axios.create(config)
        .get(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${hashFromRedis}`);

      return response?.status === constants.HTTP_STATUS_OK;
    }, {
      retries: 5,
    });
    return false;
  }

  public static async generateReport(templateHash: string, report: Report, formatter?: string): Promise<AxiosResponse<string>> {
    let response: AxiosResponse<string> = undefined;
    await retry(async () => {
      const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const reportBody: Record<string, unknown> = {
        data: {
          ...report.data,
        },
        options: {
          'cacheReport': false,
          'convertTo': report.reportExtension.toString(),
          'overwrite': true,

        },
      };
      if (!!formatter) {
        reportBody.formatters = formatter;
      }
      response = await axios.create(config)
        .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${templateHash}/render`);
    }, {
      retries: 5,
    });
    return response;
  }
}
