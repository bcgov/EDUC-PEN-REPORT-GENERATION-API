import express, {Request, Response} from 'express';
import {AuthHandler} from '../../middleware/auth-handler';
import {Report} from '../../struct/v1/report';
import {constants} from 'http2';
import logger from '../../components/logger';
import {plainToClass} from 'class-transformer';
import {validate, ValidationError} from 'class-validator';
import {ReportGenerationService} from '../../service/report-generation-service';
import {SCOPE} from '../../config/scope';
import {AxiosResponse} from 'axios';

export class ReportGenerationController {
  private readonly _router: any;

  public constructor() {
    this._router = express.Router();
    this._router.post('/v1/reports', AuthHandler.validateScope(SCOPE.GENERATE_PEN_REPORT), this.generateReport);
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
        const generatedFile: AxiosResponse = await ReportGenerationService.instance.generateBatchResponseReport(report);
        res.setHeader('Content-disposition', generatedFile?.headers['content-disposition']);
        res.setHeader('Content-type', generatedFile?.headers['content-type']);
        res.setHeader('content-length', generatedFile?.headers['content-length']);
        res.setHeader('content-transfer-encoding', generatedFile?.headers['content-transfer-encoding']);
        res.status(constants.HTTP_STATUS_OK).send(generatedFile?.data);
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
