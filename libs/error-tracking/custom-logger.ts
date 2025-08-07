import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { SentryErrorTracker } from './sentry-integration.js';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

// Log format types
export type LogFormat = 'json' | 'simple' | 'detailed';

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    userAgent?: string;
    ip?: string;
    userId?: string;
  };
  performance?: {
    duration: number;
    memory: NodeJS.MemoryUsage;
  };
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
  console: boolean;
  file?: {
    enabled: boolean;
    path: string;
    maxSize: number; // in MB
    maxFiles: number;
  };
  sentry?: {
    enabled: boolean;
    captureLevel: LogLevel;
  };
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  format: process.env.LOG_FORMAT === 'json' ? 'json' : 'simple',
  console: true,
  file: {
    enabled: process.env.NODE_ENV === 'production',
    path: process.env.LOG_FILE || 'logs/app.log',
    maxSize: 100, // 100MB
    maxFiles: 5
  },
  sentry: {
    enabled: !!process.env.SENTRY_DSN,
    captureLevel: LogLevel.ERROR
  }
};

// Custom Logger class
export class CustomLogger {
  private config: LoggerConfig;
  private fileStream?: NodeJS.WritableStream;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.initializeFileLogging();
  }

  private initializeFileLogging(): void {
    if (!this.config.file?.enabled || !this.config.file?.path) return;

    try {
      const logDir = dirname(this.config.file.path);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }

      this.fileStream = createWriteStream(this.config.file.path, { flags: 'a' });
      
      this.fileStream.on('error', (error) => {
        console.error('Logger file stream error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize file logging:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    switch (this.config.format) {
      case 'json':
        return JSON.stringify(entry) + '\n';
      
      case 'detailed':
        let output = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
        
        if (entry.meta && Object.keys(entry.meta).length > 0) {
          output += `\n  Meta: ${JSON.stringify(entry.meta, null, 2)}`;
        }
        
        if (entry.request) {
          output += `\n  Request: ${entry.request.method} ${entry.request.url}`;
          if (entry.request.userId) output += ` (User: ${entry.request.userId})`;
        }
        
        if (entry.performance) {
          output += `\n  Performance: ${entry.performance.duration}ms, Memory: ${Math.round(entry.performance.memory.heapUsed / 1024 / 1024)}MB`;
        }
        
        if (entry.error) {
          output += `\n  Error: ${entry.error.name} - ${entry.error.message}`;
          if (entry.error.stack) {
            output += `\n  Stack: ${entry.error.stack}`;
          }
        }
        
        return output + '\n';
      
      case 'simple':
      default:
        return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}\n`;
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    meta?: Record<string, any>,
    error?: Error,
    request?: LogEntry['request'],
    performance?: LogEntry['performance']
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message,
      meta
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    if (request) {
      entry.request = request;
    }

    if (performance) {
      entry.performance = performance;
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);

    // Console output
    if (this.config.console) {
      const level = entry.level.toUpperCase();
      if (level === 'ERROR') {
        console.error(formattedMessage.trim());
      } else if (level === 'WARN') {
        console.warn(formattedMessage.trim());
      } else {
        console.log(formattedMessage.trim());
      }
    }

    // File output
    if (this.fileStream) {
      this.fileStream.write(formattedMessage);
    }

    // Sentry integration
    if (this.config.sentry?.enabled) {
      const logLevel = LogLevel[entry.level.toUpperCase() as keyof typeof LogLevel];
      
      if (logLevel <= this.config.sentry.captureLevel) {
        if (entry.error) {
          const error = new Error(entry.error.message);
          error.name = entry.error.name;
          error.stack = entry.error.stack;
          
          SentryErrorTracker.captureException(error, {
            tags: {
              logLevel: entry.level,
              source: 'custom-logger'
            },
            extra: {
              originalMessage: entry.message,
              meta: entry.meta,
              request: entry.request,
              performance: entry.performance
            }
          });
        } else if (logLevel === LogLevel.ERROR) {
          SentryErrorTracker.captureMessage(entry.message, {
            level: 'error',
            tags: { source: 'custom-logger' },
            extra: entry.meta
          });
        }
      }
    }
  }

  // Public logging methods
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, meta, error);
    this.writeLog(entry);
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, meta);
    this.writeLog(entry);
  }

  info(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, meta);
    this.writeLog(entry);
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, meta);
    this.writeLog(entry);
  }

  trace(message: string, meta?: Record<string, any>): void {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    
    const entry = this.createLogEntry(LogLevel.TRACE, message, meta);
    this.writeLog(entry);
  }

  // Request logging with performance tracking
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userAgent?: string,
    ip?: string,
    userId?: string,
    error?: Error
  ): void {
    const level = error || statusCode >= 400 ? LogLevel.ERROR : 
                 statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
    
    if (!this.shouldLog(level)) return;

    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { statusCode },
      error,
      { method, url, userAgent, ip, userId },
      { duration, memory: process.memoryUsage() }
    );
    
    this.writeLog(entry);
  }

  // Database query logging
  logDatabaseQuery(query: string, duration: number, error?: Error): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
    
    if (!this.shouldLog(level)) return;

    const message = `Database query executed in ${duration}ms`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { query: query.substring(0, 200) + (query.length > 200 ? '...' : '') },
      error,
      undefined,
      { duration, memory: process.memoryUsage() }
    );
    
    this.writeLog(entry);
  }

  // Security event logging
  logSecurityEvent(
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    ip?: string,
    userId?: string
  ): void {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    
    if (!this.shouldLog(level)) return;

    const message = `Security event: ${eventType} (${severity})`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { eventType, severity, ...details },
      undefined,
      { method: '', url: '', ip, userId }
    );
    
    this.writeLog(entry);
  }

  // AI operation logging
  logAIOperation(
    operation: string,
    model: string,
    tokens: number,
    duration: number,
    cost?: number,
    error?: Error
  ): void {
    const level = error ? LogLevel.ERROR : LogLevel.INFO;
    
    if (!this.shouldLog(level)) return;

    const message = `AI operation: ${operation} using ${model} - ${tokens} tokens in ${duration}ms`;
    
    const entry = this.createLogEntry(
      level,
      message,
      { operation, model, tokens, cost },
      error,
      undefined,
      { duration, memory: process.memoryUsage() }
    );
    
    this.writeLog(entry);
  }

  // Performance monitoring
  startTimer(): () => void {
    const start = process.hrtime.bigint();
    
    return () => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1000000; // Convert to milliseconds
    };
  }

  // Graceful shutdown
  async close(): Promise<void> {
    if (this.fileStream) {
      return new Promise((resolve, reject) => {
        this.fileStream!.once('error', reject);
        this.fileStream!.end(() => resolve());
      });
    }
  }
}

// Create default logger instance
export const logger = new CustomLogger();

// Export convenient functions
export const logError = (message: string, error?: Error, meta?: Record<string, any>) => 
  logger.error(message, error, meta);

export const logWarn = (message: string, meta?: Record<string, any>) => 
  logger.warn(message, meta);

export const logInfo = (message: string, meta?: Record<string, any>) => 
  logger.info(message, meta);

export const logDebug = (message: string, meta?: Record<string, any>) => 
  logger.debug(message, meta);

export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userAgent?: string,
  ip?: string,
  userId?: string,
  error?: Error
) => logger.logRequest(method, url, statusCode, duration, userAgent, ip, userId, error);

export default {
  CustomLogger,
  logger,
  LogLevel,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logRequest
};
