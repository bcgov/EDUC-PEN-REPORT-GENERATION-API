import {Client, connect, NatsConnectionOptions} from 'ts-nats';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';

export class NatsClient {

  public static connection: Client;

  public constructor() {
    const server: string = Configuration.getConfig(CONFIG_ELEMENT.NATS_URL);
    const natsOptions: NatsConnectionOptions = {
      url: server,
      name: 'PEN-REPORT-GENERATION-API',
      servers: [server],
      maxReconnectAttempts: 60,
      name: 'PEN-REPORT-GENERATION-API',
      reconnectTimeWait: 5000, // wait 5 seconds before retrying...
      waitOnFirstConnect: true,
      pingInterval: 2000,
    };
    connect(natsOptions).then((client: Client) => {
      NatsClient.connection = client;
      client.on('error', (reason: any) => {
        logger.error(`error on NATS ${reason}`);
      });
      client.on('connection_lost', (error: any) => {
        logger.error('disconnected from NATS', error);
      });
      client.on('close', (error: any) => {
        logger.error('NATS closed', error);
        process.exit(1);
      });
      client.on('reconnecting', () => {
        logger.error('NATS reconnecting');
      });
      client.on('reconnect', () => {
        logger.info('NATS reconnected');
      });
    }).catch((e) => {
      logger.error(e);
    });
  }
}

