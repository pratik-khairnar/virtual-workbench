const EventEmitter = require('events');

/**
 * Simple in-process event bus.
 * Replaces Kafka for the MVP — same publish/subscribe pattern,
 * swap to KafkaJS later by matching the interface.
 */
class EventBus extends EventEmitter {
  publish(topic, payload) {
    const event = {
      id: require('crypto').randomUUID(),
      topic,
      timestamp: new Date().toISOString(),
      payload,
    };
    console.log(`[EventBus] Publishing to "${topic}":`, JSON.stringify(event, null, 2));
    this.emit(topic, event);
    return event;
  }

  subscribe(topic, handler) {
    console.log(`[EventBus] Subscribed to "${topic}"`);
    this.on(topic, handler);
  }
}

// Singleton — both services share the same bus
module.exports = new EventBus();
