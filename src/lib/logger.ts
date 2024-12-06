import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

class Logger {
    private static instance: Logger;
    private isDevelopment: boolean;

    private constructor() {
        this.isDevelopment = config.environment === 'development';
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogMessage {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            context
        };
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
        const logMessage = this.formatMessage(level, message, context);
        
        // In development, log everything with full context
        if (this.isDevelopment) {
            console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
                `[${logMessage.timestamp}] ${level.toUpperCase()}: ${message}`,
                context ? '\nContext:' : '',
                context ?? ''
            );
            return;
        }

        // In production, only log warnings and errors
        if (level === 'warn' || level === 'error') {
            console[level](
                `[${logMessage.timestamp}] ${level.toUpperCase()}: ${message}`,
                context ? '\nContext:' : '',
                context ?? ''
            );
        }
    }

    public debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    public info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    public warn(message: string, context?: Record<string, unknown>): void {
        this.log('warn', message, context);
    }

    public error(message: string, error?: Error, context?: Record<string, unknown>): void {
        this.log('error', message, {
            ...context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
}

export const logger = Logger.getInstance(); 