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
        baseUrl: process.env.CDOGS_BASE_URL,
      },
      report_templates: {
        batch_response: process.env.BATCH_RESPONSE_TEMPLATE,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      messaging: {
        natsUrl: process.env.NATS_URL,
        natsMaxReconnect: process.env.NATS_MAX_RECONNECT,
      },
    });
  }

  public static getConfig(key: string): any {
    return Configuration._nconf.get(key);
  }
}
new Configuration();
