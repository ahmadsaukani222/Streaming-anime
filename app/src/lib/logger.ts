/**
 * Logger utility that only logs in development mode
 * Automatically suppresses logs in production
 */

const isDev = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

export const logger: Logger = {
  log: (...args: unknown[]) => {
    if (isDev || isTest) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev || isTest) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but in production you might want to send to error tracking
    if (isDev || isTest) {
      console.error(...args);
    } else {
      // In production, could send to Sentry, LogRocket, etc.
      // Example: Sentry.captureException(args[0]);
    }
  },
  info: (...args: unknown[]) => {
    if (isDev || isTest) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev || isTest) {
      console.debug(...args);
    }
  },
};

/**
 * Create a namespaced logger
 * Usage: const log = createLogger('ComponentName');
 *        log.log('message'); // [ComponentName] message
 */
export function createLogger(namespace: string): Logger {
  return {
    log: (...args: unknown[]) => {
      if (isDev || isTest) {
        console.log(`[${namespace}]`, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (isDev || isTest) {
        console.warn(`[${namespace}]`, ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (isDev || isTest) {
        console.error(`[${namespace}]`, ...args);
      } else {
        // Production error tracking
      }
    },
    info: (...args: unknown[]) => {
      if (isDev || isTest) {
        console.info(`[${namespace}]`, ...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (isDev || isTest) {
        console.debug(`[${namespace}]`, ...args);
      }
    },
  };
}

export default logger;
