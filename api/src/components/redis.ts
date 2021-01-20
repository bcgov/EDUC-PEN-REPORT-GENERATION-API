import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';
import IORedis from 'ioredis';

export class Redis {
  private static _redisClient: IORedis.Redis | IORedis.Cluster;

  public constructor() {
    if ('local' === Configuration.getConfig(CONFIG_ELEMENT.ENVIRONMENT)) {
      Redis._redisClient = new IORedis({
        host: Configuration.getConfig(CONFIG_ELEMENT.REDIS_HOST),
        port: Configuration.getConfig(CONFIG_ELEMENT.REDIS_PORT),
      });
    } else {
      Redis._redisClient = new IORedis.Cluster([{
        host: Configuration.getConfig(CONFIG_ELEMENT.REDIS_HOST),
        port: Configuration.getConfig(CONFIG_ELEMENT.REDIS_PORT),
      }]);
    }
    Redis._redisClient.on('error', (error) => {
      logger.error(`error occurred in redis client. ${error}`);
    });
  }

  public static getRedisClient(): IORedis.Redis | IORedis.Cluster {
    return this._redisClient;
  }
}
new Redis();
