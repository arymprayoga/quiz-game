class MemoryManager {
    constructor() {
        this.cleanupInterval = null;
        this.stats = {
            playersCleanedUp: 0,
            lobbiesCleanedUp: 0,
            cacheEntriesCleanedUp: 0
        };
    }

    // Start periodic cleanup
    startPeriodicCleanup(intervalMs = 5 * 60 * 1000) { // 5 minutes
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, intervalMs);

        console.log('Memory cleanup started with interval:', intervalMs, 'ms');
    }

    // Stop periodic cleanup
    stopPeriodicCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    // Perform comprehensive cleanup
    performCleanup() {
        console.log('Starting periodic memory cleanup...');

        const startTime = Date.now();

        // Clean up HTTP cache
        this.cleanupHttpCache();

        // Clean up event throttler
        this.cleanupEventThrottler();

        // Force garbage collection if available
        this.suggestGarbageCollection();

        const endTime = Date.now();
        console.log(`Memory cleanup completed in ${endTime - startTime}ms`);

        // Log memory usage
        this.logMemoryUsage();
    }

    // Cleanup HTTP cache
    cleanupHttpCache() {
        const httpClient = require('./HttpClient');
        const cacheBefore = httpClient.getCacheStats().size;

        // Clear old cache entries (manual implementation since we have simple cache)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        let cleanedEntries = 0;

        for (const [key, value] of httpClient.cache) {
            if (value.timestamp < fiveMinutesAgo) {
                httpClient.cache.delete(key);
                cleanedEntries++;
            }
        }

        this.stats.cacheEntriesCleanedUp += cleanedEntries;
        console.log(`Cleaned ${cleanedEntries} old cache entries (${cacheBefore} -> ${httpClient.getCacheStats().size})`);
    }

    // Cleanup event throttler
    cleanupEventThrottler() {
        const eventThrottler = require('./EventThrottler');
        const throttlesBefore = eventThrottler.getStats().activeThrottles;

        // Clean up old throttle entries
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        let cleanedThrottles = 0;

        for (const [key, value] of eventThrottler.throttles) {
            if (value.lastCall < fiveMinutesAgo) {
                if (value.pending) {
                    clearTimeout(value.pending);
                }
                eventThrottler.throttles.delete(key);
                cleanedThrottles++;
            }
        }

        console.log(`Cleaned ${cleanedThrottles} old throttle entries (${throttlesBefore} -> ${eventThrottler.getStats().activeThrottles})`);
    }

    // Suggest garbage collection
    suggestGarbageCollection() {
        if (global.gc) {
            const memBefore = process.memoryUsage().heapUsed;
            global.gc();
            const memAfter = process.memoryUsage().heapUsed;
            const freed = memBefore - memAfter;
            console.log(`Garbage collection freed ${this.formatBytes(freed)} memory`);
        }
    }

    // Enhanced player cleanup
    cleanupPlayer(player, connection) {
        // Clear all player references
        if (player) {
            player.position = null;
            player.lobby = null;
            player.socket = null;
        }

        // Clear connection references
        if (connection) {
            connection.socket = null;
            connection.player = null;
            connection.server = null;
            connection.lobby = null;
        }

        this.stats.playersCleanedUp++;
    }

    // Enhanced lobby cleanup
    cleanupLobby(lobby) {
        if (!lobby) return;

        // Clear all lobby data
        if (lobby.connections) {
            lobby.connections.length = 0;
        }

        if (lobby.settings) {
            // Clear large whiteboard data
            lobby.settings.whiteboardData = '';
            lobby.settings.textData = '';
            lobby.settings.shapeData = '';
        }

        this.stats.lobbiesCleanedUp++;
    }

    // Log memory usage statistics
    logMemoryUsage() {
        const usage = process.memoryUsage();
        console.log('Memory Usage:', {
            heapUsed: this.formatBytes(usage.heapUsed),
            heapTotal: this.formatBytes(usage.heapTotal),
            external: this.formatBytes(usage.external),
            rss: this.formatBytes(usage.rss)
        });
        console.log('Cleanup Stats:', this.stats);
    }

    // Get detailed memory statistics
    getMemoryStats() {
        const httpClient = require('./HttpClient');
        const eventThrottler = require('./EventThrottler');

        return {
            memory: process.memoryUsage(),
            cache: httpClient.getCacheStats(),
            throttles: eventThrottler.getStats(),
            cleanupStats: this.stats,
            uptime: process.uptime()
        };
    }

    // Format bytes to human readable format
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Set connection limit per lobby
    checkConnectionLimit(lobby, maxConnections = 50) {
        if (lobby.connections && lobby.connections.length >= maxConnections) {
            console.warn(`Lobby ${lobby.id} has reached connection limit (${maxConnections})`);
            return false;
        }
        return true;
    }
}

module.exports = new MemoryManager();
