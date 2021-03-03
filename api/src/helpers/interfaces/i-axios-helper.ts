import {AxiosResponse} from 'axios';

export interface IAxiosHelper {
  post(url: string, data: any, headers?: any): Promise<AxiosResponse>
  get(url: string, headers?: any): Promise<AxiosResponse>
}
