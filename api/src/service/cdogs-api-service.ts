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
    return await retry(async () => {
      const bodyFormData = new FormData();
      bodyFormData.append('template', fs.createReadStream(templatePath, {encoding: 'base64'}));
      try {
        const apiToken = await AuthHandler.getCDOGsApiToken();
        const config: AxiosRequestConfig = {
          timeout: 30000,
          headers: {
            ...bodyFormData.getHeaders(),
            'Authorization': `Bearer ${apiToken}`,
          },
        };
        axios
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template`, bodyFormData, config)
          .then((uploadResponse: AxiosResponse) => {
            if (uploadResponse?.status === constants.HTTP_STATUS_OK) {
              return uploadResponse?.headers['X-Template-Hash'];
            } else {
              throw new Error('No Template Hash from CDOGS API.');
            }
          }).catch((e) => {
          // CDOGS API will respond like this if same file is uploaded, API will catch that and return the hash.
            const detail: string = e?.response?.data?.detail;
            if (detail && detail.includes('File already cached')) {
              return detail.substring(27, detail.length - 2);
            } else {
              logger.error(e);
              throw e;
            }
          });
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }, {
      retries: 5,
    });
  }

  public static async isReportTemplateCachedInCdogs(hashFromRedis: string): Promise<string> {
    return await retry(async () => {
      const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const response: AxiosResponse<string> = await axios.create(config)
        .get(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${hashFromRedis}`);
      if (response?.status === constants.HTTP_STATUS_OK) {
        return response?.headers['x-template-hash'];
      } else {
        throw new Error('No Template Hash from CDOGS API.');
      }
    }, {
      retries: 5,
    });
  }

  public static async generateReportWithInlineTemplate(templatePath: string, report: Report, formatter?: string): Promise<AxiosResponse<string>> {
    logger.info(`generateReport called with  templatePath :: ${templatePath}, formatter::  ${formatter}`, report);
    return await retry(async () => {
      const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const reportBody: Record<string, unknown> = this.createPostBody(report);
      reportBody.template = {
        'content': fs.readFileSync(templatePath, {encoding: 'base64'}),
        'encodingType': 'base64',
        'fileType': 'docx',
      };
      if (!!formatter) {
        reportBody.formatters = formatter;
      }
      try {
        return await axios.create(config)
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/render`, reportBody);
      } catch (err) {
        logger.error(err);
        throw err;
      }

    }, {
      retries: 1,
    });
  }

  public static async generateReportFromTemplateHash(templateHash: string, report: Report, formatter?: string): Promise<AxiosResponse<string>> {
    logger.info(`generateReport called with  templateHash :: ${templateHash}, formatter::  ${formatter}`, report);
    return await retry(async () => {
      const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cdogsApiToken}`,
        },
      };
      const reportBody = this.createPostBody(report);
      if (!!formatter) {
        reportBody.formatters = formatter;
      }
      try {
        return await axios.create(config)
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${templateHash}/render`, reportBody);
      } catch (err) {
        logger.error(err);
        throw err;
      }

    }, {
      retries: 1,
    });
  }

  private static createPostBody(report: Report): Record<string, unknown> {
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
}
