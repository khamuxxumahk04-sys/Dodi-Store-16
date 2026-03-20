// Store-Genius Room Event Bridge
// Captures and broadcasts store events for AI monitoring

class StoreBridge {
    constructor() {
        this.eventQueue = [];
        this.maxQueueSize = 100;

        // Safety check for BroadcastChannel
        try {
            this.channel = typeof BroadcastChannel !== 'undefined'
                ? new BroadcastChannel('dodi-store-events')
                : { postMessage: () => console.warn('BroadcastChannel not supported') };
        } catch (e) {
            console.warn('BroadcastChannel initialization failed:', e);
            this.channel = { postMessage: () => { } };
        }

        this.analytics = {
            totalEvents: 0,
            eventsByType: {}
        };

        console.log('Bridge initialized');
    }


    /**
     * Emit an event to all listeners
     * @param {string} type - Event type (e.g., 'product_add', 'gigi_message')
     * @param {object} data - Event data
     */
    emit(type, data = {}) {
        const event = {
            id: this.generateEventId(),
            type,
            timestamp: Date.now(),
            data,
            source: 'dodi-store'
        };

        // Add to queue
        this.eventQueue.push(event);
        if (this.eventQueue.length > this.maxQueueSize) {
            this.eventQueue.shift(); // Remove oldest event
        }

        // Update analytics
        this.analytics.totalEvents++;
        this.analytics.eventsByType[type] = (this.analytics.eventsByType[type] || 0) + 1;

        // Broadcast to Genius Room and other listeners
        this.channel.postMessage(event);

        // Store in localStorage for persistence
        this.saveToStorage();

        console.log(`📡 Event emitted: ${type}`, data);

        return event;
    }

    /**
     * Get recent events
     * @param {number} count - Number of events to retrieve
     * @returns {Array} Recent events
     */
    getRecentEvents(count = 10) {
        return this.eventQueue.slice(-count);
    }

    /**
     * Get events by type
     * @param {string} type - Event type to filter
     * @returns {Array} Filtered events
     */
    getEventsByType(type) {
        return this.eventQueue.filter(e => e.type === type);
    }

    /**
     * Generate unique event ID
     * @returns {string} Unique ID
     */
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save event queue to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('storeEvents', JSON.stringify({
                queue: this.eventQueue,
                analytics: this.analytics,
                lastUpdated: Date.now()
            }));
        } catch (e) {
            console.warn('Failed to save events to storage:', e);
        }
    }

    /**
     * Load events from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('storeEvents');
            if (saved) {
                const data = JSON.parse(saved);
                this.eventQueue = data.queue || [];
                this.analytics = data.analytics || { totalEvents: 0, eventsByType: {} };
            }
        } catch (e) {
            console.warn('Failed to load events from storage:', e);
        }
    }

    /**
     * Clear all events
     */
    clearEvents() {
        this.eventQueue = [];
        this.analytics = { totalEvents: 0, eventsByType: {} };
        this.saveToStorage();
        console.log('🧹 Events cleared');
    }

    /**
     * Get analytics summary
     * @returns {object} Analytics data
     */
    getAnalytics() {
        return {
            ...this.analytics,
            queueSize: this.eventQueue.length,
            oldestEvent: this.eventQueue[0]?.timestamp,
            newestEvent: this.eventQueue[this.eventQueue.length - 1]?.timestamp
        };
    }
}

// Create global instance
window.storeBridge = new StoreBridge();

// Load previous events on initialization
window.storeBridge.loadFromStorage();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoreBridge;
}
