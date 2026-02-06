/**
 * Logger utility that respects environment configuration
 * Automatically suppresses logs in production based on DEBUG_LOGS flag
 */

import { DEBUG_LOGS, IS_DEVELOPMENT } from '@/config/api';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

/**
 * Create a namespaced logger
 * Usage: const log = createLogger('ComponentName');
 *        log.log('message'); // [ComponentName] message
 */
export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;

  return {
    log: (...args: unknown[]) => {
      if (DEBUG_LOGS) {
        console.log(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (DEBUG_LOGS) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      // Always log errors, but in production you might want to send to error tracking
      if (DEBUG_LOGS || IS_DEVELOPMENT) {
        console.error(prefix, ...args);
      } else {
        // In production, could send to Sentry, LogRocket, etc.
        // Example: Sentry.captureException(args[0]);
      }
    },
    info: (...args: unknown[]) => {
      if (DEBUG_LOGS) {
        console.info(prefix, ...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (DEBUG_LOGS) {
        console.debug(prefix, ...args);
      }
    },
  };
}

// Default logger instance
export const logger: Logger = createLogger('App');

export default logger;
