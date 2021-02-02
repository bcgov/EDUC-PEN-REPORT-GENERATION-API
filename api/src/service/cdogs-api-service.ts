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
    return new Promise((resolve, reject) => {
      retry(() => {
        let templateHash: string;
        const bodyFormData = new FormData();
        bodyFormData.append('template', fs.createReadStream(templatePath, {encoding: 'base64'}));
        AuthHandler.getCDOGsApiToken().then((token: string) => {
          const config: AxiosRequestConfig = {
            timeout: 30000,
            headers: {
              ...bodyFormData.getHeaders(),
              'Authorization': `Bearer ${token}`,
            },
          };
          axios
            .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template`, bodyFormData, config)
            .then((uploadResponse: AxiosResponse) => {
              if (uploadResponse?.status === constants.HTTP_STATUS_OK) {
                return resolve(uploadResponse?.headers['X-Template-Hash']);
              } else {
                return reject('Template hash was not returned from CDOGS API.');
              }
            }).catch((e) => {
            // CDOGS API will respond like this if same file is uploaded, API will catch that and delete and re-upload the file.
            const detail: string = e?.response?.data?.detail;
            if (detail && detail.includes('File already cached')) {
              templateHash = detail.substring(27, detail.length - 2);
              const deleteReqConfig: AxiosRequestConfig = {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              };
              logger.info(`template hash which already exist and needs to be deleted is ::`, templateHash);
              axios.delete(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${templateHash}`, deleteReqConfig)
                .then((deleteResponse: AxiosResponse) => {
                  logger.info('deleteResponse?.data', deleteResponse?.data);
                  logger.info('deleteResponse?.headers', deleteResponse?.headers);
                  axios
                    .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template`, bodyFormData, config)
                    .then((reUploadResponse: AxiosResponse) => {
                      if (reUploadResponse?.status === constants.HTTP_STATUS_OK) {
                        return resolve(reUploadResponse?.headers['X-Template-Hash']);
                      }
                    })
                    .catch((reUploadError) => {
                      console.error(reUploadError);
                      logger.error('re-upload template error response data', reUploadError?.response?.data);
                      logger.error('re-upload template error response headers', reUploadError?.response?.headers);
                      throw reUploadError;
                    })
                })
                .catch((deleteError) => {
                  logger.error(deleteError);
                  throw deleteError;
                });
            } else {
              logger.error(e);
              throw e;
            }
          })

        }).catch(e => {
          logger.error(e);
          throw e;
        });
      }, {
        retries: 5,
      });
    });
  }

  public static async isReportTemplateCachedInCdogs(hashFromRedis: string): Promise<string> {
    return new Promise(async (resolve) => {
      await retry(async () => {
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
          return resolve(response?.headers['x-template-hash']);
        }

      }, {
        retries: 5,
      });
    });

  }

  public static async generateReport(templatePath: string, report: Report, formatter?: string): Promise<AxiosResponse<string>> {
    return new Promise(async (resolve) => {
      logger.info(`generateReport called with  templatePath :: ${templatePath}, formatter::  ${formatter}`, report);
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
            'reportName': report.reportName
          },
          template: {
            'content': fs.readFileSync(templatePath, {encoding: 'base64'}),
            'encodingType': "base64",
            'fileType': "docx"
          }
        };
        if (!!formatter) {
          reportBody.formatters = formatter;
        }
        /*        axios.interceptors.request.use(request => {
                  logger.info('Starting Request', request)
                  return request
                });

                axios.interceptors.response.use(axiosResponse => {
                  logger.info('Response:', axiosResponse)
                  return axiosResponse
                });*/
        try {
          response = await axios.create(config)
            .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/render`, reportBody);
        } catch (err) {
          logger.error(err);
        }

      }, {
        retries: 1,
      });
      return resolve(response);
    });
  }

  public static async generateReportFromTemplateHash(templateHash: string, report: Report, formatter?: string): Promise<AxiosResponse<string>> {
    return new Promise(async (resolve) => {
      logger.info(`generateReport called with  templateHash :: ${templateHash}, formatter::  ${formatter}`, report);
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
            'reportName': report.reportName
          }
        };
        if (!!formatter) {
          reportBody.formatters = formatter;
        }
        /*        axios.interceptors.request.use(request => {
                  logger.info('Starting Request', request)
                  return request
                });

                axios.interceptors.response.use(axiosResponse => {
                  logger.info('Response:', axiosResponse)
                  return axiosResponse
                });*/
        try {
          response = await axios.create(config)
            .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}/api/v2/template/${templateHash}/render`, reportBody);
        } catch (err) {
          logger.error(err);
        }

      }, {
        retries: 1,
      });
      return resolve(response);
    });
  }
}
