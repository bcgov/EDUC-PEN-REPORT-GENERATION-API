import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';
import IORedis from 'ioredis';

let connectionClosed = false;

export class Redis {
  private static _instance: Redis;
  private static _redisClient: IORedis.Redis | IORedis.Cluster;

  private constructor() {
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
    Redis._redisClient.on('ready', () => {
      logger.info('Redis Ready.');
    });
    Redis._redisClient.on('connect', () => {
      logger.info('connected to redis.');
    });
    Redis._redisClient.on('end', (error) => {
      logger.error(`redis client end. ${error}`);
      connectionClosed = true;
    });
  }

  public static getRedisClient(): IORedis.Redis | IORedis.Cluster {
    return this._redisClient;
  }

  public isConnectionClosed(): boolean {
    return connectionClosed;
  }
  public static get instance(): Redis {
    if (!Redis._instance) {
      Redis._instance = new Redis();
    }
    return Redis._instance;
  }
}

