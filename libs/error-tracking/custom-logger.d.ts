export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}
export type LogFormat = 'json' | 'simple' | 'detailed';
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
export interface LoggerConfig {
    level: LogLevel;
    format: LogFormat;
    console: boolean;
    file?: {
        enabled: boolean;
        path: string;
        maxSize: number;
        maxFiles: number;
    };
    sentry?: {
        enabled: boolean;
        captureLevel: LogLevel;
    };
}
export declare class CustomLogger {
    private config;
    private fileStream?;
    constructor(config?: Partial<LoggerConfig>);
    private initializeFileLogging;
    private shouldLog;
    private formatMessage;
    private createLogEntry;
    private writeLog;
    error(message: string, error?: Error, meta?: Record<string, any>): void;
    warn(message: string, meta?: Record<string, any>): void;
    info(message: string, meta?: Record<string, any>): void;
    debug(message: string, meta?: Record<string, any>): void;
    trace(message: string, meta?: Record<string, any>): void;
    logRequest(method: string, url: string, statusCode: number, duration: number, userAgent?: string, ip?: string, userId?: string, error?: Error): void;
    logDatabaseQuery(query: string, duration: number, error?: Error): void;
    logSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, any>, ip?: string, userId?: string): void;
    logAIOperation(operation: string, model: string, tokens: number, duration: number, cost?: number, error?: Error): void;
    startTimer(): () => void;
    close(): Promise<void>;
}
export declare const logger: CustomLogger;
export declare const logError: (message: string, error?: Error, meta?: Record<string, any>) => void;
export declare const logWarn: (message: string, meta?: Record<string, any>) => void;
export declare const logInfo: (message: string, meta?: Record<string, any>) => void;
export declare const logDebug: (message: string, meta?: Record<string, any>) => void;
export declare const logRequest: (method: string, url: string, statusCode: number, duration: number, userAgent?: string, ip?: string, userId?: string, error?: Error) => void;
declare const _default: {
    CustomLogger: typeof CustomLogger;
    logger: CustomLogger;
    LogLevel: typeof LogLevel;
    logError: (message: string, error?: Error, meta?: Record<string, any>) => void;
    logWarn: (message: string, meta?: Record<string, any>) => void;
    logInfo: (message: string, meta?: Record<string, any>) => void;
    logDebug: (message: string, meta?: Record<string, any>) => void;
    logRequest: (method: string, url: string, statusCode: number, duration: number, userAgent?: string, ip?: string, userId?: string, error?: Error) => void;
};
export default _default;
