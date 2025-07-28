const winston = require('winston');

class Logger {
    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }

        // Create Winston logger with multiple transports
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'quiz-game-server' },
            transports: [
                // Write all logs with importance level of `error` or less to `error.log`
                new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // Write all logs with importance level of `info` or less to `combined.log`
                new winston.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // Console transport for development
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });

        Logger.instance = this;
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, error = null, meta = {}) {
        const errorMeta = error ? {
            ...meta,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            }
        } : meta;

        this.logger.error(message, errorMeta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Log server performance metrics
    logPerformance(operation, duration, meta = {}) {
        this.info(`Performance: ${operation}`, {
            ...meta,
            duration: `${duration}ms`,
            type: 'performance'
        });
    }

    // Log API requests
    logApiRequest(method, url, statusCode, duration, meta = {}) {
        this.info(`API Request: ${method} ${url}`, {
            ...meta,
            statusCode,
            duration: `${duration}ms`,
            type: 'api'
        });
    }

    // Log player actions
    logPlayerAction(playerId, action, meta = {}) {
        this.info(`Player Action: ${action}`, {
            ...meta,
            playerId,
            type: 'player'
        });
    }

    // Log lobby events
    logLobbyEvent(lobbyId, event, playerCount, meta = {}) {
        this.info(`Lobby Event: ${event}`, {
            ...meta,
            lobbyId,
            playerCount,
            type: 'lobby'
        });
    }
}

module.exports = new Logger();
