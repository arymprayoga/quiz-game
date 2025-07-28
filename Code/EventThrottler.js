class EventThrottler {
    constructor() {
        this.throttles = new Map();
    }

    // Throttle function for specific event types per connection
    throttle(key, func, limit = 100) { // Default 100ms throttle (10 events/sec max)
        const now = Date.now();
        const throttleData = this.throttles.get(key);

        if (!throttleData || (now - throttleData.lastCall) >= limit) {
            this.throttles.set(key, { lastCall: now });
            return func();
        }
        
        // Event was throttled - optionally store last attempt for batching
        if (throttleData.pending) {
            clearTimeout(throttleData.pending);
        }
        
        throttleData.pending = setTimeout(() => {
            this.throttles.set(key, { lastCall: Date.now() });
            func();
        }, limit - (now - throttleData.lastCall));
        
        return false; // Indicates event was throttled
    }

    // Cleanup throttle data for disconnected connections
    cleanup(keyPrefix) {
        for (const [key] of this.throttles) {
            if (key.startsWith(keyPrefix)) {
                const throttleData = this.throttles.get(key);
                if (throttleData.pending) {
                    clearTimeout(throttleData.pending);
                }
                this.throttles.delete(key);
            }
        }
    }

    // Get statistics
    getStats() {
        return {
            activeThrottles: this.throttles.size,
            keys: Array.from(this.throttles.keys())
        };
    }
}

module.exports = new EventThrottler();