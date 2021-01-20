import {NextFunction, Request, Response} from 'express';
import logger from '../components/logger';

export class ErrorHandlerMiddleware {
  public static handleJSONParsingErrors(err: any, req: Request, res: Response, next: NextFunction): any {
    if (err) {
      let errorMessage = 'Invalid JSON provided.';
      if (err instanceof SyntaxError) {
        errorMessage = 'The JSON provided is malformed and cannot be processed.';
      } else if (err.hasOwnProperty('type') && err.type === 'entity.too.large') {
        errorMessage = 'The JSON provided is is too large and cannot be processed.';
      }
      const responseJson = {
        error: errorMessage,
      };
      return res.status(400).json(responseJson);
    } else {
      next();
    }
  }

  public static catchNotFoundError(req: Request, res: Response): void {
    res.sendStatus(404);
  }

  public static handleError(err: any, req: Request, res: Response, next: NextFunction): any {
    if (err) {
      logger.error(err);
      res.status(500).json(err?.stack);
    } else {
      next();
    }

  }
}
