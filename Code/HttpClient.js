const axios = require('axios');

class HttpClient {
    constructor() {
        if (HttpClient.instance) {
            return HttpClient.instance;
        }

        // Create axios instance with optimized settings
        this.client = axios.create({
            baseURL: 'http://localhost:4000/api',
            timeout: 10000, // 10 second timeout
            maxRedirects: 3,
            // Connection pooling settings
            maxSockets: 50,
            keepAlive: true,
            keepAliveMsecs: 1000,
            headers: {
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            }
        });

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            response => {
                const logger = require('./Logger');
                logger.logApiRequest(
                    response.config.method?.toUpperCase(),
                    response.config.url,
                    response.status,
                    Date.now() - response.config.metadata?.startTime || 0
                );
                return response;
            },
            error => {
                const ErrorHandler = require('./ErrorHandler');
                ErrorHandler.handleHttpError(error, {
                    component: 'HttpClient'
                });
                return Promise.reject(error);
            }
        );

        // Request interceptor to add timing
        this.client.interceptors.request.use(
            config => {
                config.metadata = { startTime: Date.now() };
                return config;
            },
            error => Promise.reject(error)
        );

        // Simple in-memory cache
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

        HttpClient.instance = this;
    }

    // Cache helper methods
    getCacheKey(method, url, data) {
        return `${method.toUpperCase()}:${url}:${JSON.stringify(data || {})}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    // API methods
    async post(url, data, useCache = false) {
        const cacheKey = this.getCacheKey('POST', url, data);
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) {
                return { data: cached };
            }
        }

        const response = await this.client.post(url, data);
        
        if (useCache) {
            this.setCache(cacheKey, response.data);
        }
        
        return response;
    }

    async get(url, useCache = true) {
        const cacheKey = this.getCacheKey('GET', url);
        
        if (useCache) {
            const cached = this.getCache(cacheKey);
            if (cached) {
                return { data: cached };
            }
        }

        const response = await this.client.get(url);
        
        if (useCache) {
            this.setCache(cacheKey, response.data);
        }
        
        return response;
    }

    // Clear cache method
    clearCache() {
        this.cache.clear();
    }

    // Get cache stats
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
module.exports = new HttpClient();