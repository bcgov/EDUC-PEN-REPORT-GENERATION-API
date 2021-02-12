import {Configuration} from '../../src/config/configuration';
import {CONFIG_ELEMENT} from '../../src/config/config-element';

describe('Configuration', () => {
  test('Environment', () => {
    const env = Configuration.getConfig(CONFIG_ELEMENT.ENVIRONMENT);
    expect(env).toBe('test');
  });
  test('Log level', () => {
    const logLevel = Configuration.getConfig(CONFIG_ELEMENT.LOG_LEVEL);
    expect(logLevel).toBe('silly');
  });
  test('oidc jwks-url', () => {
    const value = Configuration.getConfig(CONFIG_ELEMENT.OIDC_JWKS_URL);
    expect(value).toBe('http://test');
  });
});
