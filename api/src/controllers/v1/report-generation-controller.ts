import express, {Request, Response} from 'express';
import logger from '../../components/logger';
import {AuthHandler} from '../../middleware/auth-handler';

export class ReportGenerationController {
  private readonly _router: any;

  public constructor() {
    this._router = express.Router();
    this._router.get('/v1/reports', AuthHandler.validateScope('READ_POSSIBLE_MATCH'), this.getReportHandler);
    this._router.post('/v1/reports', AuthHandler.validateScope('READ_POSSIBLE_MATCH'), this.postReportHandler);
  }

  public getReportHandler(req: Request, res: Response): void {
    logger.info('request params is', req.params);
    res.status(200).json({message: 'got it'});
  }
  public postReportHandler(req: Request, res: Response): void {
    logger.info('request params is', req.params);
    res.status(200).json({message: 'got it'});
  }

  public get Router(): any {
    return this._router;
  }


}
