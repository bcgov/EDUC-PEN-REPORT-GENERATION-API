import fs from 'fs';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {AuthHandler} from '../middleware/auth-handler';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from '../components/logger';
import retry from 'async-retry';
import {constants} from 'http2';

export class CdogsApiService {

  public static async uploadTemplate(templatePath: string): Promise<string> {
    let templateHash = '';
    await retry(async () => {
      try {
        const contents = fs.readFileSync(templatePath, {encoding: 'base64'});
        const cdogsApiToken = await AuthHandler.getCDOGsApiToken();
        const config: AxiosRequestConfig = {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${cdogsApiToken}`,
          },
        };
        const bodyFormData = new FormData();
        bodyFormData.append('template', contents);
        const response: AxiosResponse = await axios
          .post(`${Configuration.getConfig(CONFIG_ELEMENT.CDOGS_BASE_URL)}'/api/v2/template`, bodyFormData, config);
        if (response?.status === constants.HTTP_STATUS_OK) {
          templateHash = response?.headers['X-Template-Hash'];
        }
      } catch (e) {
        logger.error(e);
        throw e;
      }
    }, {
      retries: 5,
    });
    return templateHash;
  }
}
