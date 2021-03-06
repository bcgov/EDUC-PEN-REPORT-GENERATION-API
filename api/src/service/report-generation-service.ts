import {Report} from '../struct/v1/report';
import logger from '../components/logger';
import {Redis} from '../components/redis';
import {REPORT_TYPE} from '../config/report-type';
import {CdogsApiService} from './cdogs-api-service';
import path from 'path';
import {AxiosResponse} from 'axios';
import {injectable, postConstruct} from 'inversify';
import {IReportGenerationService} from './interfaces/i-report-generation-service';
import {BatchReport} from '../struct/v1/batch/batch-report';

/**
 * Singleton service class.
 */
@injectable()
export class ReportGenerationService implements IReportGenerationService {

  private readonly _redisClient: Redis;
  private readonly _cdogsApiService: CdogsApiService;

  /**
   * during application startup , remove template hashes from REDIS, call CDOGS API and upload all templates and store there hash keys
   */
  public constructor(redisClient: Redis, cdogsApiService: CdogsApiService) {
    this._redisClient = redisClient;
    this._cdogsApiService = cdogsApiService;
  }

  @postConstruct()
  public init(): void {
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
  public async generateReport(report: Report<any>): Promise<AxiosResponse> {
    if (report.reportType === REPORT_TYPE.prbResponseReport){
      this.highlightDifferences(report as BatchReport);
    }
    logger.debug(`Converted to struct report data: ${JSON.stringify(report)}`);
    logger.debug(`Converted to struct report data: ${JSON.stringify(report.reportType)}`);
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

  private highlightDifferences(batchreport: BatchReport): void {
    const batchArray = batchreport.data.diffList;

    batchArray.forEach(batchItem => {
      const school = batchItem.school;
      const min = batchItem.min;

      batchItem.min.penDiff = this.hasDifference(school.pen, min.pen);
      batchItem.min.surnameDiff = this.hasDifference(school.surname, min.surname);
      batchItem.min.givenNameDiff = this.hasDifference(school.givenName, min.givenName);
      batchItem.min.legalMiddleNamesDiff = this.hasDifference(school.legalMiddleNames, min.legalMiddleNames);
      batchItem.min.genderDiff = this.hasDifference(school.gender, min.gender);
      batchItem.min.birthDateDiff = this.hasDifference(school.birthDate, min.birthDate);
      batchItem.min.schoolIDDiff = this.hasDifference(school.schoolID, min.schoolID );

      logger.silly('Batch Item: ' + JSON.stringify(batchItem));
    });
  }

  private hasDifference(schoolVal: string, minVal: string): string {
    if (schoolVal !== minVal){
      return 'true';
    }
    return 'false';
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
