import {Configuration} from '../config/configuration';
import {createLogger, format, transports} from 'winston';
import {inspect} from 'util';
import {omit, pickBy} from 'lodash';
import hasAnsi from 'has-ansi';
import stripAnsi from 'strip-ansi';
import safeStringify from 'fast-safe-stringify';
import DailyRotateFile from 'winston-daily-rotate-file';
import {Format} from 'logform';
import {CONFIG_ELEMENT} from '../config/config-element';

const loggerFunctions = {
  isPrimitive(val: any): boolean {
    return val === undefined || (typeof val !== 'object' && typeof val !== 'function');
  },

  formatWithInspect(val: any, colors: any = true): any {
    if (val instanceof Error) {
      return '';
    }

    const shouldFormat = typeof val !== 'string' && !hasAnsi(val);
    const formattedVal = shouldFormat ? inspect(val, {
      depth: undefined,
      colors,
    }) : (colors ? val : stripAnsi(val));

    return this.isPrimitive(val) ? formattedVal : `\n${formattedVal}`;
  },

  /**
   * Handles all the different log formats
   * https://github.com/winstonjs/winston/issues/1427#issuecomment-535297716
   * https://github.com/winstonjs/winston/issues/1427#issuecomment-583199496
   *
   * @param {*} colors
   */
  getDomainWinstonLoggerFormat(colors: any = true): any {
    const colorize = colors ? format.colorize() : undefined;
    const loggingFormats = [
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      format.errors({stack: true}),
      colorize,
      format.printf((info) => {
        const stackTrace = info.stack ? `\n${info.stack}` : '';

        // handle single object
        if (!info.message) {
          const obj = omit(info, ['level', 'timestamp', Symbol.for('level')]);
          return `${info.timestamp} - ${info.level}: ${this.formatWithInspect(obj, colors)}${stackTrace}`;
        }

        // @ts-ignore
        const splatArgs = info[Symbol.for('splat')] || [];
        const rest = splatArgs.map(data => this.formatWithInspect(data, colors)).join(' ');
        const msg = this.formatWithInspect(info.message, colors);

        return `${info.timestamp} - ${info.level}: ${msg} ${rest}${stackTrace}`;
      }),
    ].filter(Boolean);
    return format.combine(...loggingFormats);
  },

  /**
   * Handles JSON formats
   */
  getDomainWinstonLoggerJsonFormat(): Format {
    const loggingFormats = [
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      format.errors({stack: true}),
      format.printf((info) => {
        const stackTrace = info.stack || '';

        let message;
        // handle single object
        if (!info.message) {
          message = omit(info, ['level', 'timestamp', Symbol.for('level')]);
        } else {
          message = stripAnsi(info.message);
        }

        // @ts-ignore
        const splatArgs = info[Symbol.for('splat')] || [];
        const detail = splatArgs.map(data => typeof data === 'string' ? stripAnsi(data) : data);

        return safeStringify(pickBy({
          timestamp: info.timestamp,
          level: info.level,
          message,
          detail: detail.length > 0 ? detail : undefined,
          stackTrace,
        }));
      }),
    ];
    return format.combine(...loggingFormats);
  },
};


const logger = createLogger({
  level: Configuration.getConfig(CONFIG_ELEMENT.LOG_LEVEL),
  format: loggerFunctions.getDomainWinstonLoggerJsonFormat(),
  transports: [
    new DailyRotateFile({
      filename: 'app-%DATE%.log',
      dirname: './logs',
      datePattern: 'YYYY-MM-DD',
      maxSize: '5m',
      maxFiles: 1,
      zippedArchive: true,
    }),
  ],
});

logger.add(new transports.Console({
  format: loggerFunctions.getDomainWinstonLoggerFormat(true),
}));
export default logger;
