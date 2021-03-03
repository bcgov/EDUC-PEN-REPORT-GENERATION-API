import {Report} from '../struct/v1/report';
import logger from '../components/logger';
import {Redis} from '../components/redis';
import {REPORT_TYPE} from '../config/report-type';
import {CdogsApiService} from './cdogs-api-service';
import path from 'path';
import {AxiosResponse} from 'axios';
import {injectable} from 'inversify';
import {IReportGenerationService} from './interfaces/i-report-generation-service';

/**
 * Singleton service class.
 */
@injectable()
export class ReportGenerationService implements IReportGenerationService{

  private readonly _redisClient: Redis;
  private readonly _cdogsApiService: CdogsApiService;

  /**
   * during application startup , remove template hashes from REDIS, call CDOGS API and upload all templates and store there hash keys
   */
  public constructor(redisClient: Redis, cdogsApiService: CdogsApiService) {
    this._redisClient = redisClient;
    this._cdogsApiService = cdogsApiService;
    Object.values(REPORT_TYPE).forEach(reportTypeKey => {
      this.removeTemplateHashFromRedis(reportTypeKey).then(() => {
        const templatePath: string = path.join(__dirname, `../templates/${reportTypeKey}.docx`);
        logger.info('template path is ', templatePath);
        this._cdogsApiService.uploadTemplate(templatePath).then((templateHash: string) => {
          logger.info('got template hash from CDOGS API', templateHash);
          if (!!templateHash) {
            this.saveTemplateHashIntoRedis(reportTypeKey, templateHash).then(() => {
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

  /**
   * this method expects a valid report structure to be passed.
   * it returns the encoded string as is from CDOGS API.
   *
   * @param report
   */
  public async generateReport(report: Report): Promise<AxiosResponse> {
    let hashFromRedis: string = await this.getTemplateHashFromRedis(report.reportType);
    const templatePath: string = path.join(__dirname, `../templates/${report.reportType.toString()}.docx`);
    let cachedKeyFromCdogs: string;
    logger.info('hashFromRedis is ', hashFromRedis);
    if (!!hashFromRedis) {
      logger.silly('check if the report template is cached in CDOGS API');
      cachedKeyFromCdogs = await this._cdogsApiService.isReportTemplateCachedInCdogs(hashFromRedis);
    }
    if (!hashFromRedis || !cachedKeyFromCdogs || hashFromRedis !== cachedKeyFromCdogs) {
      hashFromRedis = await this._cdogsApiService.uploadTemplate(templatePath);
      if (hashFromRedis) {
        await this.saveTemplateHashIntoRedis(report.reportType.toString(), hashFromRedis);
      } else {
        throw new Error('could not upload template to cdogs api');
      }
    }
    return await this._cdogsApiService.generateReportFromTemplateHash(hashFromRedis, report);
  }

  // if there is hash in redis return that
  private async getTemplateHashFromRedis(reportType: string): Promise<string> {
    return await this._redisClient.getRedisClient().get(reportType.toString());
  }

  // if there is hash in redis return that
  private async removeTemplateHashFromRedis(reportType: string): Promise<number> {
    return await this._redisClient.getRedisClient().del(reportType);
  }

  private async saveTemplateHashIntoRedis(reportTypeKey: string, templateHash: string): Promise<string> {
    return await this._redisClient.getRedisClient().set(reportTypeKey, templateHash);
  }
}
