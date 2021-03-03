import {Client, connect, ClientOpts} from 'nats';
import {Configuration} from '../config/configuration';
import {CONFIG_ELEMENT} from '../config/config-element';
import logger from './logger';
import {NatsSubscriber} from './nats-subscriber';
import {ReportGenerationService} from '../service/report-generation-service';

let connectionClosed = false;

export class NatsClient {
  public static get connection(): Client {
    return this._connection;
  }

  private static _connection: Client;

  public constructor(reportGenerationService: ReportGenerationService) {
    const server: string = Configuration.getConfig(CONFIG_ELEMENT.NATS_URL);
    const natsMaxReconnect: number = Configuration.getConfig(CONFIG_ELEMENT.NATS_MAX_RECONNECT);
    const natsOptions: ClientOpts = {
      url: server,
      servers: [server],
      maxReconnectAttempts: natsMaxReconnect,
      name: 'PEN-REPORT-GENERATION-API',
      reconnectTimeWait: 5000, // wait 5 seconds before retrying...
      waitOnFirstConnect: true,
      pingInterval: 2000,
      encoding: 'binary',
    };
    const client: Client = connect(natsOptions);
    NatsClient._connection = client;
    const natsSubscriber = new NatsSubscriber(reportGenerationService);
    client.on('connect', () => {
      logger.info('NATS connected!');
      natsSubscriber.subscribe(client);
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
  }

  public isConnectionClosed(): boolean {
    return connectionClosed;
  }
}
