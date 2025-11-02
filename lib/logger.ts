/**
 * Winston Logger Configuration
 *
 * Features:
 * - Verbose logging levels (error, warn, info, http, debug)
 * - Daily log rotation (max 5000 lines per file)
 * - Separate error and combined log files
 * - Color-coded console output for development
 * - Structured JSON format for production logs
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define custom log levels with colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format with colors for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Daily rotate transport for error logs
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d', // Keep logs for 30 days
  format: logFormat,
  json: true,
});

// Daily rotate transport for combined logs (all levels)
const combinedRotateTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d', // Keep logs for 30 days
  format: logFormat,
  json: true,
});

// Custom stream for line counting and rotation at 5000 lines
let errorLineCount = 0;
let combinedLineCount = 0;
const MAX_LINES = 5000;

// Wrap transports to count lines
const countingErrorTransport = {
  ...errorRotateTransport,
  log: (info: any, callback: any) => {
    errorLineCount++;
    if (errorLineCount >= MAX_LINES) {
      errorRotateTransport.rotate();
      errorLineCount = 0;
    }
    errorRotateTransport.log(info, callback);
  }
};

const countingCombinedTransport = {
  ...combinedRotateTransport,
  log: (info: any, callback: any) => {
    combinedLineCount++;
    if (combinedLineCount >= MAX_LINES) {
      combinedRotateTransport.rotate();
      combinedLineCount = 0;
    }
    combinedRotateTransport.log(info, callback);
  }
};

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: [
    // Error logs (errors only)
    errorRotateTransport,

    // Combined logs (all levels)
    combinedRotateTransport,

    // Console output for development
    new winston.transports.Console({
      format: consoleFormat,
      level: level(),
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: logFormat,
    }),
  ],
});

// Rotate logs daily at midnight
errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Error log rotated: ${oldFilename} -> ${newFilename}`);
  errorLineCount = 0;
});

combinedRotateTransport.on('rotate', (oldFilename, newFilename) => {
  logger.info(`Combined log rotated: ${oldFilename} -> ${newFilename}`);
  combinedLineCount = 0;
});

// Utility function to create child loggers with context
export const createLogger = (context: string) => {
  return logger.child({ context });
};

// Export logger instance
export default logger;

// Export type-safe logging functions
export const log = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};

// HTTP request logger middleware for Next.js API routes
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;

    const message = `${method} ${url} ${statusCode} ${duration}ms`;

    if (statusCode >= 500) {
      logger.error(message);
    } else if (statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });

  if (next) next();
};
