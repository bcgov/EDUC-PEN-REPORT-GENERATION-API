import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import {injectable} from 'inversify';
import {AuthHandler} from '../middleware/auth-handler';
import {IAxiosHelper} from './interfaces/i-axios-helper';

@injectable()
export class AxiosHelper implements IAxiosHelper {
  private _authHandler: AuthHandler;

  public constructor(authHandler: AuthHandler) {
    this._authHandler = authHandler;
  }

  public async post(url: string, data: any, headers?: any): Promise<AxiosResponse> {
    const apiToken: string = await this._authHandler.getCDOGsApiToken();
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

  public  async get(url: string, headers?: any): Promise<AxiosResponse> {
    const apiToken: string = await this._authHandler.getCDOGsApiToken();
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
