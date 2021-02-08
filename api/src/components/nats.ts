import {Client, connect, NatsConnectionOptions} from 'ts-nats';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';

let connectionClosed = false;

export class NatsClient {

  public static connection: Client;
  private static _instance: NatsClient;

  private constructor() {
    const server: string = Configuration.getConfig(CONFIG_ELEMENT.NATS_URL);
    const natsMaxReconnect: number = Configuration.getConfig(CONFIG_ELEMENT.NATS_MAX_RECONNECT);
    const natsOptions: NatsConnectionOptions = {
      url: server,
      servers: [server],
      maxReconnectAttempts: natsMaxReconnect,
      name: 'PEN-REPORT-GENERATION-API',
      reconnectTimeWait: 5000, // wait 5 seconds before retrying...
      waitOnFirstConnect: true,
      pingInterval: 2000,
    };
    connect(natsOptions).then((client: Client) => {
      NatsClient.connection = client;
      client.on('connect', () => {
        logger.info('NATS connected!');
      });
      client.on('error', (reason: any) => {
        logger.error(`error on NATS ${reason}`);
      });
      client.on('connection_lost', (error: any) => {
        logger.error('disconnected from NATS', error);
      });
      client.on('close', (error: any) => {
        logger.error('NATS closed', error);
        connectionClosed = true;
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

  public isConnectionClosed(): boolean {
    return connectionClosed;
  }

  public static get instance(): NatsClient {
    if (!NatsClient._instance) {
      NatsClient._instance = new NatsClient();
    }
    return NatsClient._instance;
  }
}
