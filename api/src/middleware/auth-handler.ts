import {Configuration} from '../config/configuration';
import createRemoteJWKSet from 'jose/jwks/remote';
import {NextFunction, Request, Response} from 'express';
import jwtVerify, {GetKeyFunction, JWSHeaderParameters} from 'jose/jwt/verify';
import {constants} from 'http2';
import {FlattenedJWSInput, JWTVerifyResult} from 'jose/webcrypto/types';
import logger from '../components/logger';
import {CONFIG_ELEMENT} from '../config/config-element';
import axios, {AxiosResponse} from 'axios';
import safeStringify from 'fast-safe-stringify';
import qs from 'querystring';

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

  /**
   * this function returns access token to call CDOGS API
   */
  public static async getCDOGsApiToken(): Promise<string> {
    try {
      const response: AxiosResponse = await axios.post(Configuration.getConfig(CONFIG_ELEMENT.CDOGS_TOKEN_ENDPOINT),
        qs.stringify({
          client_id: Configuration.getConfig(CONFIG_ELEMENT.CDOGS_CLIENT_ID),
          client_secret: Configuration.getConfig(CONFIG_ELEMENT.CDOGS_CLIENT_SECRET),
          grant_type: 'client_credentials',
        }), {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      logger.silly('getCDOGsApiToken Res', safeStringify(response.data));
      return response.data.access_token;
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }
}
