import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { SentryErrorTracker } from './sentry-integration.js';
// Log levels
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (LogLevel = {}));
// Default configuration
const defaultConfig = {
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
    config;
    fileStream;
    constructor(config) {
        this.config = { ...defaultConfig, ...config };
        this.initializeFileLogging();
    }
    initializeFileLogging() {
        if (!this.config.file?.enabled || !this.config.file?.path)
            return;
        try {
            const logDir = dirname(this.config.file.path);
            if (!existsSync(logDir)) {
                mkdirSync(logDir, { recursive: true });
            }
            this.fileStream = createWriteStream(this.config.file.path, { flags: 'a' });
            this.fileStream.on('error', (error) => {
                console.error('Logger file stream error:', error);
            });
        }
        catch (error) {
            console.error('Failed to initialize file logging:', error);
        }
    }
    shouldLog(level) {
        return level <= this.config.level;
    }
    formatMessage(entry) {
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
                    if (entry.request.userId)
                        output += ` (User: ${entry.request.userId})`;
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
    createLogEntry(level, message, meta, error, request, performance) {
        const entry = {
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
    writeLog(entry) {
        const formattedMessage = this.formatMessage(entry);
        // Console output
        if (this.config.console) {
            const level = entry.level.toUpperCase();
            if (level === 'ERROR') {
                console.error(formattedMessage.trim());
            }
            else if (level === 'WARN') {
                console.warn(formattedMessage.trim());
            }
            else {
                console.log(formattedMessage.trim());
            }
        }
        // File output
        if (this.fileStream) {
            this.fileStream.write(formattedMessage);
        }
        // Sentry integration
        if (this.config.sentry?.enabled) {
            const logLevel = LogLevel[entry.level.toUpperCase()];
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
                }
                else if (logLevel === LogLevel.ERROR) {
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
    error(message, error, meta) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const entry = this.createLogEntry(LogLevel.ERROR, message, meta, error);
        this.writeLog(entry);
    }
    warn(message, meta) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        const entry = this.createLogEntry(LogLevel.WARN, message, meta);
        this.writeLog(entry);
    }
    info(message, meta) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const entry = this.createLogEntry(LogLevel.INFO, message, meta);
        this.writeLog(entry);
    }
    debug(message, meta) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const entry = this.createLogEntry(LogLevel.DEBUG, message, meta);
        this.writeLog(entry);
    }
    trace(message, meta) {
        if (!this.shouldLog(LogLevel.TRACE))
            return;
        const entry = this.createLogEntry(LogLevel.TRACE, message, meta);
        this.writeLog(entry);
    }
    // Request logging with performance tracking
    logRequest(method, url, statusCode, duration, userAgent, ip, userId, error) {
        const level = error || statusCode >= 400 ? LogLevel.ERROR :
            statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
        if (!this.shouldLog(level))
            return;
        const message = `${method} ${url} ${statusCode} - ${duration}ms`;
        const entry = this.createLogEntry(level, message, { statusCode }, error, { method, url, userAgent, ip, userId }, { duration, memory: process.memoryUsage() });
        this.writeLog(entry);
    }
    // Database query logging
    logDatabaseQuery(query, duration, error) {
        const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
        if (!this.shouldLog(level))
            return;
        const message = `Database query executed in ${duration}ms`;
        const entry = this.createLogEntry(level, message, { query: query.substring(0, 200) + (query.length > 200 ? '...' : '') }, error, undefined, { duration, memory: process.memoryUsage() });
        this.writeLog(entry);
    }
    // Security event logging
    logSecurityEvent(eventType, severity, details, ip, userId) {
        const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
        if (!this.shouldLog(level))
            return;
        const message = `Security event: ${eventType} (${severity})`;
        const entry = this.createLogEntry(level, message, { eventType, severity, ...details }, undefined, { method: '', url: '', ip, userId });
        this.writeLog(entry);
    }
    // AI operation logging
    logAIOperation(operation, model, tokens, duration, cost, error) {
        const level = error ? LogLevel.ERROR : LogLevel.INFO;
        if (!this.shouldLog(level))
            return;
        const message = `AI operation: ${operation} using ${model} - ${tokens} tokens in ${duration}ms`;
        const entry = this.createLogEntry(level, message, { operation, model, tokens, cost }, error, undefined, { duration, memory: process.memoryUsage() });
        this.writeLog(entry);
    }
    // Performance monitoring
    startTimer() {
        const start = process.hrtime.bigint();
        return () => {
            const end = process.hrtime.bigint();
            return Number(end - start) / 1000000; // Convert to milliseconds
        };
    }
    // Graceful shutdown
    async close() {
        if (this.fileStream) {
            return new Promise((resolve, reject) => {
                this.fileStream.end((error) => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            });
        }
    }
}
// Create default logger instance
export const logger = new CustomLogger();
// Export convenient functions
export const logError = (message, error, meta) => logger.error(message, error, meta);
export const logWarn = (message, meta) => logger.warn(message, meta);
export const logInfo = (message, meta) => logger.info(message, meta);
export const logDebug = (message, meta) => logger.debug(message, meta);
export const logRequest = (method, url, statusCode, duration, userAgent, ip, userId, error) => logger.logRequest(method, url, statusCode, duration, userAgent, ip, userId, error);
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
