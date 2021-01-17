type Callback<T> = (data: T, event?: string) => void;

/**
 * A very simple event emitter class
 */
export class EventEmitter<T> {
  callbacks = new Map<string, Set<Callback<T>>>();
  wildListener = new Set<Callback<T>>();

  /**
   * @param {string} event
   * @param {Function} cb  => Function which will contain the data emitted
   * if wildcard '*' is used,it also gets the event type
   * returns unsubscribe function
   */
  on(event: string, cb: Callback<T>) {
    if (event === '*') {
      this.wildListener.add(cb);
      return () => this.wildListener.delete(cb);
    }

    let callbacks = this.callbacks.get(event);

    if (!callbacks) {
      callbacks = new Set();
      this.callbacks.set(event, callbacks);
    }

    callbacks.add(cb);

    // unsubscribe Return => why possible undefined?
    return () => callbacks?.delete(cb);
  }

  emit(event: string, data: T) {
    const cbs = this.callbacks.get(event);

    if (cbs) {
      cbs.forEach((cb) => cb(data, event));
    } else {
      // console.log("Nobody is listening to this event type");
    }

    this.wildListener.forEach((cb) => cb(data, event));
  }
}
