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
        bodyLimit: '50mb',
      },
      oidc: {
        clientId: process.env.ID,
        clientSecret: process.env.SECRET,
        discovery: process.env.DISCOVERY,
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
