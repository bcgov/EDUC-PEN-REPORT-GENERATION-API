import nconf from 'nconf';
import path from 'path';

export class Configuration {
  private static _nconf: any;

  public constructor() {
    Configuration._nconf = nconf;
    const env = process.env.NODE_ENV;
    nconf.argv()
      .file({file: path.join(__dirname, `${env}.json`)});

    nconf.defaults({
      environment: env,
      server: {
        logLevel: process.env.LOG_LEVEL,
        morganFormat: 'dev',
        port: '3000',
        bodyLimit: process.env.BODY_LIMIT,
      },
      oidc: {
        jwksUrl: process.env.JWKS_URL,
      },
      cdogs: {
        clientID: process.env.CDOGS_CLIENT_ID,
        clientSecret: process.env.CDOGS_CLIENT_SECRET,
        tokenEndpoint: process.env.CDOGS_TOKEN_ENDPOINT,
      },
    });
  }

  public static getConfig(key: string): any {
    if (undefined === Configuration._nconf) {
      new Configuration();
    }
    return Configuration._nconf.get(key);
  }
}
