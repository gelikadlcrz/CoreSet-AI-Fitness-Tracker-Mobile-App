try {
  // Patch static properties on Event class
  Object.defineProperty(Event, 'NONE', {
    writable: true, configurable: true, value: 0,
  });
  Object.defineProperty(Event, 'CAPTURING_PHASE', {
    writable: true, configurable: true, value: 1,
  });
  Object.defineProperty(Event, 'AT_TARGET', {
    writable: true, configurable: true, value: 2,
  });
  Object.defineProperty(Event, 'BUBBLING_PHASE', {
    writable: true, configurable: true, value: 3,
  });
} catch (e) {}

try {
  // Also patch prototype just in case
  Object.defineProperty(Event.prototype, 'NONE', {
    writable: true, configurable: true, value: 0,
  });
} catch (e) {}