
type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;

class EventEmitter<T extends EventMap> {
  private listeners: {
    [K in keyof T]?: Array<(p: T[K]) => void>;
  } = {};

  on<K extends EventKey<T>>(key: K, fn: (p: T[K]) => void): void {
    this.listeners[key] = (this.listeners[key] || []).concat(fn);
  }

  off<K extends EventKey<T>>(key: K, fn: (p: T[K]) => void): void {
    this.listeners[key] = (this.listeners[key] || []).filter((f) => f !== fn);
  }

  emit<K extends EventKey<T>>(key: K, data: T[K]): void {
    (this.listeners[key] || []).forEach(function (fn) {
      fn(data);
    });
  }
}

// Define your event types here
type AppEvents = {
  'refresh-logs': void;
};

// Singleton instance of the event emitter
export const events = new EventEmitter<AppEvents>();
