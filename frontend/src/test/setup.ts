import '@testing-library/jest-dom/vitest';

// JSDOM does not calculate layout dimensions; mock clientHeight and offsetHeight for virtualizer tests
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 1000 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 500 });
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 1000 });

HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    width: 1000,
    height: 500,
    top: 0,
    left: 0,
    bottom: 500,
    right: 1000,
    x: 0,
    y: 0,
    toJSON: () => '',
  };
};
