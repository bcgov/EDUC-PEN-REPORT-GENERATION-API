import {Configuration} from './config/configuration';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import nocache from 'nocache';
import logger from './components/logger';
import 'reflect-metadata'; // this shim is required
import {ErrorHandlerMiddleware} from './middleware/error-handler-middleware';
import {ReportGenerationController} from './controllers/v1/report-generation-controller';
import {CONFIG_ELEMENT} from './config/config-element';
import {HealthCheckController} from './controllers/health-check';
import expressStatusMonitor = require('express-status-monitor');
import {iocContainer} from './config/inversify.config';
import {ReportGenerationService} from './service/report-generation-service';

export class App {
  public expressApplication: express.Application;

  public constructor() {
    this.expressApplication = express();
    this.expressApplication.set('trust proxy', 1);
    this.expressApplication.use(expressStatusMonitor({path: '/api/status'}));
    this.expressApplication.use(compression());
    this.expressApplication.use(cors());
    this.expressApplication.use(helmet());
    this.expressApplication.use(nocache());
    this.expressApplication.use(express.urlencoded({extended: true}));
    this.expressApplication.use(cookieParser());
    this.expressApplication.use(express.json({
      limit: Configuration.getConfig(CONFIG_ELEMENT.JSON_BODY_LIMIT),
    }));
    const logStream = {
      write: (message) => {
        logger.info(message);
      },
    };
    const reportGenerationService = iocContainer.resolve(ReportGenerationService);
    reportGenerationService.init();
    const healthCheckController = iocContainer.resolve(HealthCheckController);
    this.expressApplication.use(healthCheckController.Router);
    this.expressApplication.use(morgan(Configuration.getConfig(CONFIG_ELEMENT.MORGAN_FORMAT), {'stream': logStream}));
    this.expressApplication.use(ErrorHandlerMiddleware.handleJSONParsingErrors); // JSON formatting error handling
    // set up routing to auth and main API
    const apiRouter = express.Router();
    this.expressApplication.use(/(\/api)?/, apiRouter);
    const reportGenerationController = iocContainer.resolve(ReportGenerationController);
    apiRouter.use(reportGenerationController.Router);
    apiRouter.use(ErrorHandlerMiddleware.catchNotFoundError);
    apiRouter.use(ErrorHandlerMiddleware.handleError);
  }
}


