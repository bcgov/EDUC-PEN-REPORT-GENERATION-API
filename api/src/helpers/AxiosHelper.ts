import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {AuthHandler} from '../middleware/auth-handler';

export class AxiosHelper {
  public static async post(url: string, data: any, headers?: any): Promise<AxiosResponse> {
    const apiToken: string = await AuthHandler.getCDOGsApiToken();
    const config: AxiosRequestConfig = {
      timeout: 30000,
    };
    if (!!headers) {
      config.headers = headers;
      config.headers.Authorization = `Bearer ${apiToken}`;
    } else {
      config.headers = {
        'Authorization': `Bearer ${apiToken}`,
      };
    }
    return axios
      .post(url, data, config);
  }

  public static async get(url: string, headers?: any): Promise<AxiosResponse> {
    const apiToken: string = await AuthHandler.getCDOGsApiToken();
    const config: AxiosRequestConfig = {
      timeout: 30000,
    };
    if (!!headers) {
      config.headers = headers;
      config.headers.Authorization = `Bearer ${apiToken}`;
    } else {
      config.headers = {
        'Authorization': `Bearer ${apiToken}`,
      };
    }
    return axios
      .get(url, config);
  }
}
