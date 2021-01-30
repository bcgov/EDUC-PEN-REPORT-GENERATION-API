import {Report} from '../struct/v1/report';
import logger from '../components/logger';
import {Redis} from '../components/redis';
import {REPORT_TYPE} from '../config/report-type';
import {CdogsApiService} from './cdogs-api-service';
import path from 'path';

export class ReportGenerationService {

  private static _instance: ReportGenerationService;

  /**
   * during application startup , remove template hashes from REDIS, call CDOGS API and upload all templates and store there hash keys
   */
  private constructor() {
    Object.values(REPORT_TYPE).forEach(reportTypeKey => {
      ReportGenerationService.removeTemplateHashFromRedis(reportTypeKey).then(() => {
        const templatePath: string = path.join(__dirname, `../templates/${reportTypeKey}.docx`);
        logger.info('template path is ', templatePath);
        CdogsApiService.uploadTemplate(templatePath).then((templateHash: string) => {
          logger.info('got template hash from CDOGS API', templateHash);
          ReportGenerationService.saveTemplateHashIntoRedis(reportTypeKey, templateHash).then(() => {
            logger.info(`report template for ${reportTypeKey} is successfully stored in redis.`);
          }).catch((e) => {
            logger.error(e);
          });
        }).catch((e) => {
          logger.error(e);
        });
      }).catch((e) => {
        logger.error(e);
      });

    });
  }

  // if there is hash in redis return that
  private static async getTemplateHashFromRedis(reportType: string): Promise<string> {
    return await Redis.getRedisClient().get(reportType.toString());
  }


  // if there is hash in redis return that
  private static async removeTemplateHashFromRedis(reportType: string): Promise<number> {
    return await Redis.getRedisClient().del(reportType);
  }

  private static async saveTemplateHashIntoRedis(reportTypeKey: string, templateHash: string): Promise<string> {
    return await Redis.getRedisClient().set(reportTypeKey, templateHash);
  }


  /**
   * this method expects a valid report structure to be passed.
   * it returns the encoded string as is from CDOGS API.
   *
   * @param report
   */
  public async generateBatchResponseReport(report: Report): Promise<string> {
    logger.info('report object received is ', report);
    const hashFromRedis: string = await ReportGenerationService.getTemplateHashFromRedis(report.reportType);
    logger.info('hashFromRedis is ', hashFromRedis);
    if (hashFromRedis) {
      logger.info('inside if');
    } else {
      const hashKey: string = await CdogsApiService.uploadTemplate(`./templates/${report.reportType.toString()}.docx`);
      if (hashKey) {
        await ReportGenerationService.saveTemplateHashIntoRedis(report.reportType.toString(), hashKey);
      } else {
        throw new Error('could not upload template to cdogs api');
      }
    }
    return 'ok';
  }

  public static get instance(): ReportGenerationService {
    if (!ReportGenerationService._instance) {
      ReportGenerationService._instance = new ReportGenerationService();
    }
    return ReportGenerationService._instance;
  }

  public start(): void {
    logger.info('Report generation instantiated during application startup.');
  }
}
