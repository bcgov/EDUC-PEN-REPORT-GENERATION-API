import {NextFunction, Request, Response} from 'express';
import logger from '../components/logger';
import {constants} from 'http2';

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
      return res.status(constants.HTTP_STATUS_BAD_REQUEST).json(responseJson);
    } else {
      next();
    }
  }

  public static catchNotFoundError(req: Request, res: Response): void {
    res.sendStatus(constants.HTTP_STATUS_NOT_FOUND);
  }

  public static handleError(err: any, req: Request, res: Response, next: NextFunction): any {
    if (err) {
      logger.error(err);
      res.status(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR).json(err?.stack);
    } else {
      next();
    }

  }
}
