const http = require('http');
const logger = require('./Logger');

class HealthMonitor {
    constructor(port = 4001) {
        this.port = port;
        this.server = null;
        this.startTime = Date.now();
    }

    start() {
        this.server = http.createServer((req, res) => {
            const url = req.url;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            try {
                if (url === '/health') {
                    this.handleHealth(req, res);
                } else if (url === '/metrics') {
                    this.handleMetrics(req, res);
                } else if (url === '/memory') {
                    this.handleMemory(req, res);
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (error) {
                logger.error('Health monitor error', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal server error' }));
            }
        });

        this.server.listen(this.port, () => {
            logger.info(`Health monitor started on port ${this.port}`);
        });
    }

    handleHealth(req, res) {
        require('./MemoryManager');
        const httpClient = require('./HttpClient');
        const eventThrottler = require('./EventThrottler');

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage(),
            cache: httpClient.getCacheStats(),
            throttles: eventThrottler.getStats(),
            version: require('../package.json').version || '1.0.0'
        };

        res.statusCode = 200;
        res.end(JSON.stringify(health, null, 2));
    }

    handleMetrics(req, res) {
        const memoryManager = require('./MemoryManager');
        const metrics = memoryManager.getMemoryStats();

        res.statusCode = 200;
        res.end(JSON.stringify(metrics, null, 2));
    }

    handleMemory(req, res) {
        const memoryManager = require('./MemoryManager');

        // Force cleanup if requested
        if (req.method === 'POST') {
            memoryManager.performCleanup();
        }

        const memory = {
            usage: process.memoryUsage(),
            gc: global.gc ? 'available' : 'not available',
            uptime: process.uptime(),
            loadAverage: require('os').loadavg(),
            freeMemory: require('os').freemem(),
            totalMemory: require('os').totalmem()
        };

        res.statusCode = 200;
        res.end(JSON.stringify(memory, null, 2));
    }

    stop() {
        if (this.server) {
            this.server.close();
            logger.info('Health monitor stopped');
        }
    }
}

module.exports = HealthMonitor;
