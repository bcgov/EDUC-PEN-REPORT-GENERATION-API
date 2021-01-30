import {App} from './app';
import {Configuration} from './config/configuration';
import http, {Server} from 'http';
import log from './components/logger';
import logger from './components/logger';
import * as jsJoda from '@js-joda/core';
import {CONFIG_ELEMENT} from './config/config-element';
import {NatsClient} from './components/nats';
import {ReportGenerationService} from './service/report-generation-service';
// Add timestamp to log
Object.defineProperty(log, 'heading', {
  get: () => {
    return jsJoda.LocalDateTime.now().toString();
  },
});

class ReportGenerationApplication {
  private readonly _app: App;
  private readonly _port: number;
  private readonly _httpServer: Server;

  private constructor() {
    log.debug('Starting report-generation node app');
    this._app = new App();
    this._port = ReportGenerationApplication.normalizePort(Configuration.getConfig(CONFIG_ELEMENT.PORT));
    this._app.expressApplication.set('port', this._port);

    this._httpServer = http.createServer(this._app.expressApplication);
    /**
     * Listen on provided port, on all network interfaces.
     */
    this._httpServer.listen(this._port);
    this._httpServer.on('error', ReportGenerationApplication.onError);
    this._httpServer.on('listening', ReportGenerationApplication.onListening);
    new NatsClient(); // connect to NATS..
    ReportGenerationService.instance.start();
  }

  public get httpServer(): Server {
    return this._httpServer;
  }

  public get port(): number {
    return this._port;
  }

  public static start(): ReportGenerationApplication {
    return new ReportGenerationApplication();
  }

  /**
   * Normalize a port into a number, string, or false.
   */
  private static normalizePort(val: any): number {
    const portNumber = parseInt(val, 10);

    if (isNaN(portNumber)) {
      // named pipe
      return val;
    }

    if (portNumber >= 0) {
      // port number
      return portNumber;
    }

    return 0;
  }

  private static onError(error: any): void {
    if (error?.syscall !== 'listen') {
      throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error?.code) {
    case 'EACCES':
      log.error(`${reportGenerationApplication.port}  requires elevated privileges`);
      // process.exit(1);
      break;
    case 'EADDRINUSE':
      log.error(`${reportGenerationApplication.port} is already in use`);
      // process.exit(1);
      break;
    default:
      throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  private static onListening(): void {
    const addr = reportGenerationApplication.httpServer.address();
    const bind = typeof addr === 'string' ?
      `pipe  ${addr}` :
      `port  ${addr.port}`;
    log.info('Listening on ' + bind);
  }
}

export const reportGenerationApplication = ReportGenerationApplication.start();


process.on('SIGINT', () => {
  reportGenerationApplication.httpServer.close(() => {
    log.info('process terminated');
  });
});
process.on('SIGTERM', () => {
  reportGenerationApplication.httpServer.close(() => {
    log.info('process terminated');
  });
});
// Prevent unhandled rejection from crashing application
process.on('unhandledRejection', err => {
  logger.error('Error is ', err);
});
// Prevent unhandled errors from crashing application
process.on('error', err => {
  logger.error('Error is ', err);
});
