import {Configuration} from '../config/configuration';
import createRemoteJWKSet from 'jose/jwks/remote';
import {NextFunction, Request, Response} from 'express';
import jwtVerify, {GetKeyFunction, JWSHeaderParameters} from 'jose/jwt/verify';
import {constants} from 'http2';
import {FlattenedJWSInput, JWTVerifyResult} from 'jose/webcrypto/types';
import logger from '../components/logger';
import {CONFIG_ELEMENT} from '../config/config-element';

export class AuthHandler {

  private static isBootStrapped: boolean;
  private static _JWKS: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput>;

  private constructor() {
    if (!AuthHandler.isBootStrapped) {
      AuthHandler._JWKS = createRemoteJWKSet(new URL(Configuration.getConfig(CONFIG_ELEMENT.OIDC_JWKS_URL)));
      AuthHandler.isBootStrapped = true;
    }
  }

  public static validateScope(scope: string): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    new AuthHandler(); // instantiate here...
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req?.headers.authorization) {
        const tokenString = req.headers.authorization.split(' ')[1];
        logger.silly('token', tokenString);
        try {
          const jwtVerifyResult: JWTVerifyResult = await jwtVerify(tokenString, AuthHandler._JWKS);
          const scopes: string[] = jwtVerifyResult?.payload?.scope?.split(' ');
          if (scopes && scopes.includes(scope)) {
            next();
          } else {
            res.sendStatus(constants.HTTP_STATUS_FORBIDDEN);
          }
        } catch (e) {
          logger.error(e);
          res.sendStatus(constants.HTTP_STATUS_UNAUTHORIZED);
        }

      } else {
        res.sendStatus(constants.HTTP_STATUS_UNAUTHORIZED);
      }
    };

  }
}
