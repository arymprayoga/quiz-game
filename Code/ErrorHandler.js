const logger = require('./Logger');

class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandlers();
    }

    // Setup global error handlers
    setupGlobalErrorHandlers() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', error, {
                type: 'uncaughtException',
                fatal: true
            });

            // Give the logger time to write before exiting
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection', reason, {
                type: 'unhandledRejection',
                promise: promise.toString()
            });
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            this.gracefulShutdown();
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            this.gracefulShutdown();
        });
    }

    // Graceful shutdown
    gracefulShutdown() {
        const memoryManager = require('./MemoryManager');

        logger.info('Starting graceful shutdown...');

        // Stop memory cleanup
        memoryManager.stopPeriodicCleanup();

        // Log final stats
        memoryManager.logMemoryUsage();

        setTimeout(() => {
            process.exit(0);
        }, 2000);
    }

    // Safe async wrapper
    static safeAsync(fn) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                logger.error('Async operation failed', error, {
                    function: fn.name,
                    args: args.length
                });
                throw error;
            }
        };
    }

    // Safe sync wrapper
    static safeSync(fn) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                logger.error('Sync operation failed', error, {
                    function: fn.name,
                    args: args.length
                });
                throw error;
            }
        };
    }

    // HTTP error handler
    static handleHttpError(error, context = {}) {
        if (error.response) {
            // The request was made and the server responded with a status code
            logger.error('HTTP Response Error', null, {
                ...context,
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                url: error.config?.url,
                method: error.config?.method
            });
        } else if (error.request) {
            // The request was made but no response was received
            logger.error('HTTP Request Error', error, {
                ...context,
                url: error.config?.url,
                method: error.config?.method,
                timeout: error.config?.timeout
            });
        } else {
            // Something happened in setting up the request
            logger.error('HTTP Setup Error', error, context);
        }
    }

    // Socket error handler
    static handleSocketError(error, socket, context = {}) {
        logger.error('Socket Error', error, {
            ...context,
            socketId: socket?.id,
            connected: socket?.connected,
            handshake: socket?.handshake?.address
        });

        // Emit error to client if socket is still connected
        if (socket && socket.connected) {
            socket.emit('errorPesan', {
                message: 'An error occurred. Please try again.',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Lobby error handler
    static handleLobbyError(error, lobby, context = {}) {
        logger.error('Lobby Error', error, {
            ...context,
            lobbyId: lobby?.id,
            playerCount: lobby?.connections?.length || 0,
            settings: lobby?.settings ? Object.keys(lobby.settings) : []
        });
    }

    // Player error handler
    static handlePlayerError(error, player, context = {}) {
        logger.error('Player Error', error, {
            ...context,
            playerId: player?.id,
            playerType: player?.type,
            lobby: player?.lobby
        });
    }

    // Circuit breaker for external API calls
    static createCircuitBreaker(maxFailures = 5, timeout = 60000) {
        return {
            failures: 0,
            lastFailureTime: null,
            state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN

            async execute(fn) {
                if (this.state === 'OPEN') {
                    if (Date.now() - this.lastFailureTime > timeout) {
                        this.state = 'HALF_OPEN';
                    } else {
                        throw new Error('Circuit breaker is OPEN');
                    }
                }

                try {
                    const result = await fn();
                    this.onSuccess();
                    return result;
                } catch (error) {
                    this.onFailure();
                    throw error;
                }
            },

            onSuccess() {
                this.failures = 0;
                this.state = 'CLOSED';
            },

            onFailure() {
                this.failures++;
                this.lastFailureTime = Date.now();

                if (this.failures >= maxFailures) {
                    this.state = 'OPEN';
                    logger.warn('Circuit breaker opened', {
                        failures: this.failures,
                        maxFailures
                    });
                }
            }
        };
    }
}

module.exports = new ErrorHandler();
