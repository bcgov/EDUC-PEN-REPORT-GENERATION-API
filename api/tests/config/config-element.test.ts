import {CONFIG_ELEMENT} from '../../src/config/config-element';

describe('Config element', () => {
  test('LOG_LEVEL', () => {
    const logLevel = CONFIG_ELEMENT.LOG_LEVEL;
    expect(logLevel).toBe('server:logLevel');
  });
  test('PORT', () => {
    const PORT = CONFIG_ELEMENT.PORT;
    expect(PORT).toBe('server:port');
  });
});

