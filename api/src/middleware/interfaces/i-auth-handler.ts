import {NextFunction, Request, Response} from 'express';

export interface IAuthHandler {
  validateScope(scope: string): (req: Request, res: Response, next: NextFunction) => Promise<void>
  getCDOGsApiToken(): Promise<string>
}
