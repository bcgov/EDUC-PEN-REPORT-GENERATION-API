import express, {Request, Response} from 'express';
import {Report} from '../../struct/v1/report';
import {constants} from 'http2';
import logger from '../../components/logger';
import {plainToClass} from 'class-transformer';
import {validate, ValidationError} from 'class-validator';
import {ReportGenerationService} from '../../service/report-generation-service';
import {SCOPE} from '../../config/scope';
import {AxiosResponse} from 'axios';
import {injectable} from 'inversify';
import {IReportGenerationController} from './interfaces/i-report-generation-controller';
import {AuthHandler} from '../../middleware/auth-handler';

@injectable()
export class ReportGenerationController implements IReportGenerationController {

  private readonly _router: any;
  private readonly _reportGenerationService: ReportGenerationService;

  public constructor(reportGenerationService: ReportGenerationService, authHandler: AuthHandler) {
    this._router = express.Router();
    this._router.post('/v1/reports', authHandler.validateScope(SCOPE.GENERATE_PEN_REPORT), this.generateReport);
    this._reportGenerationService = reportGenerationService;
  }

  public async generateReport(req: Request, res: Response): Promise<void> {
    const report: Report = plainToClass(Report, req.body);
    logger.silly('Received report', report);
    const validationErrors: ValidationError[] = await validate(report);
    if (validationErrors?.length > 0) {
      let errorTexts = [];
      for (const errorItem of validationErrors) {
        errorTexts = errorTexts.concat(errorItem?.constraints);
      }
      res.status(constants.HTTP_STATUS_BAD_REQUEST).send(errorTexts);
      return;
    } else {
      try {
        const generatedFileResponse: AxiosResponse = await this._reportGenerationService.generateReport(report);
        logger.info('Received response status', generatedFileResponse?.status);
        logger.info('Received response headers', generatedFileResponse?.headers);
        ['Content-Disposition', 'Content-Type', 'Content-Length', 'Content-Transfer-Encoding', 'X-Report-Name'].forEach(h => {
          res.setHeader(h, generatedFileResponse.headers[h.toLowerCase()]);
        });
        res.send(generatedFileResponse.data);
        return;
      } catch (e) {
        logger.error(e);
        res.sendStatus(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR);
        return;
      }
    }
  }

  public get Router(): any {
    return this._router;
  }
}
