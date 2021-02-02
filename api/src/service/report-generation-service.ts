import {Report} from '../struct/v1/report';
import logger from '../components/logger';
import {Redis} from '../components/redis';
import {REPORT_TYPE} from '../config/report-type';
import {CdogsApiService} from './cdogs-api-service';
import path from 'path';
import {AxiosResponse} from 'axios';

/**
 * Singleton service class.
 */
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
          if (!!templateHash) {
            ReportGenerationService.saveTemplateHashIntoRedis(reportTypeKey, templateHash).then(() => {
              logger.info(`report template for ${reportTypeKey} is successfully stored in redis.`);
            }).catch((e) => {
              logger.error(e);
            });
          }
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
  public async generateBatchResponseReport(report: Report): Promise<AxiosResponse> {
    logger.info('report object received is ', report);
    let hashFromRedis: string = await ReportGenerationService.getTemplateHashFromRedis(report.reportType);
    const templatePath: string = path.join(__dirname, `../templates/${report.reportType.toString()}.docx`);
    let cachedKeyFromCdogs: string;
    logger.info('hashFromRedis is ', hashFromRedis);
    if (!!hashFromRedis) {
      logger.silly('check if the report template is cached in CDOGS API');
      cachedKeyFromCdogs = await CdogsApiService.isReportTemplateCachedInCdogs(hashFromRedis);
    }
    if (!hashFromRedis || !cachedKeyFromCdogs || hashFromRedis !== cachedKeyFromCdogs) {
      hashFromRedis = await CdogsApiService.uploadTemplate(templatePath);
      if (hashFromRedis) {
        await ReportGenerationService.saveTemplateHashIntoRedis(report.reportType.toString(), hashFromRedis);
      } else {
        //throw new Error('could not upload template to cdogs api');
      }
    }
    //const result: AxiosResponse<string> = await CdogsApiService.generateReportFromTemplateHash(hashFromRedis, report);
    return await CdogsApiService.generateReport(templatePath, report);
  }

  public static get instance(): ReportGenerationService {
    if (!ReportGenerationService._instance) {
      ReportGenerationService._instance = new ReportGenerationService();
    }
    return ReportGenerationService._instance;
  }

  public start(): void {
    logger.info('Report generation service instantiated during application startup.');
  }
}
