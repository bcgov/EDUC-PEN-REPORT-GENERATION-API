import {Request, Response} from 'express';

export interface IReportGenerationController {
  generateReport(req: Request, res: Response): Promise<void>
  Router(): any
}
