import { Container } from 'inversify';
import {ReportGenerationService} from '../service/report-generation-service';
import {Redis} from '../components/redis';
import {NatsClient} from '../components/nats';
import {HealthCheckController} from '../controllers/health-check';
import {ReportGenerationController} from '../controllers/v1/report-generation-controller';
import {AxiosHelper} from '../helpers/AxiosHelper';
import {CdogsApiService} from '../service/cdogs-api-service';
import {AuthHandler} from '../middleware/auth-handler';
import {IRedis} from '../components/interfaces/i-redis';
import {INatsClient} from '../components/interfaces/i-nats';
import {IAuthHandler} from '../middleware/interfaces/i-auth-handler';
import {IReportGenerationController} from '../controllers/v1/interfaces/i-report-generation-controller';
import {IHealthCheckController} from '../controllers/interfaces/i-health-check';
import {ICdogsApiService} from '../service/interfaces/i-cdogs-api-service';
import {IReportGenerationService} from '../service/interfaces/i-report-generation-service';
import {IAxiosHelper} from '../helpers/interfaces/i-axios-helper';

const iocContainer = new Container();
iocContainer.bind<IRedis>(Redis).toSelf();
iocContainer.bind<INatsClient>(NatsClient).toSelf();
iocContainer.bind<IAuthHandler>(AuthHandler).toSelf();
iocContainer.bind<IReportGenerationService>(ReportGenerationService).toSelf();
iocContainer.bind<IHealthCheckController>(HealthCheckController).toSelf();
iocContainer.bind<IReportGenerationController>(ReportGenerationController).toSelf();
iocContainer.bind<IAxiosHelper>(AxiosHelper).toSelf();
iocContainer.bind<ICdogsApiService>(CdogsApiService).toSelf();


export { iocContainer };
