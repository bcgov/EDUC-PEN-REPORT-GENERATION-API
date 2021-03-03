import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';
import IORedis from 'ioredis';
import {injectable} from 'inversify';
import {IRedis} from './interfaces/i-redis';

let connectionClosed = false;

@injectable()
export class Redis implements IRedis {
  private readonly _redisClient: IORedis.Redis | IORedis.Cluster;

  public constructor() {
    if ('local' === Configuration.getConfig(CONFIG_ELEMENT.ENVIRONMENT)) {
      this._redisClient = new IORedis({
        host: Configuration.getConfig(CONFIG_ELEMENT.REDIS_HOST),
        port: Configuration.getConfig(CONFIG_ELEMENT.REDIS_PORT),
      });
    } else {
      this._redisClient = new IORedis.Cluster([{
        host: Configuration.getConfig(CONFIG_ELEMENT.REDIS_HOST),
        port: Configuration.getConfig(CONFIG_ELEMENT.REDIS_PORT),
      }]);
    }
    this._redisClient.on('error', (error) => {
      logger.error(`error occurred in redis client. ${error}`);
    });
    this._redisClient.on('ready', () => {
      logger.info('Redis Ready.');
    });
    this._redisClient.on('connect', () => {
      logger.info('connected to redis.');
    });
    this._redisClient.on('end', (error) => {
      logger.error(`redis client end. ${error}`);
      connectionClosed = true;
    });
  }

  public getRedisClient(): IORedis.Redis | IORedis.Cluster {
    return this._redisClient;
  }

  public isConnectionClosed(): boolean {
    return connectionClosed;
  }
}

