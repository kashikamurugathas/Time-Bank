import EventEmitter from 'events';
import { createLogger } from './logger.ts';

const logger = createLogger('event-bus');

export type EventCallback<T = any> = (data: T) => void | Promise<void>;

class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  publish<T = any>(event: string, payload: T) {
    logger.info(`[Event Published] ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      payloadSummary: typeof payload === 'object' && payload !== null ? Object.keys(payload) : typeof payload,
    });
    this.emitter.emit(event, payload);
  }

  subscribe<T = any>(event: string, callback: EventCallback<T>) {
    logger.debug(`[Subscribed] to event: ${event}`);
    const handler = async (data: T) => {
      try {
        await callback(data);
      } catch (err: any) {
        logger.error(`[Event Error] Error handling event ${event}: ${err.message}`, {
          event,
          stack: err.stack,
        });
      }
    };
    this.emitter.on(event, handler);
    return () => {
      this.emitter.off(event, handler);
    };
  }
}

export const eventBus = new EventBus();
