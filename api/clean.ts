/**
 * Remove old files, copy front-end ones.
 */

import fs from 'fs-extra';
import Logger from 'jet-logger';

// Setup logger
const logger = new Logger();
logger.timestamp = false;


(async () => {
  try {
    // Remove current build
    await remove('./dist/');
  } catch (err) {
    logger.err(err);
  }
})();


function remove(loc: string): Promise<void> {
  return new Promise((res, rej) => {
    return fs.remove(loc, (err) => {
      return (!!err ? rej(err) : res());
    });
  });
}
