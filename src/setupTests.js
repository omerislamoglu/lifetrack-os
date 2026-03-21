// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Recharts için ResizeObserver mock'u
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Audio = class AudioMock {
  constructor() {
    this.src = '';
    this.loop = false;
    this.volume = 1;
    this.currentTime = 0;
  }

  play() {
    return Promise.resolve();
  }

  pause() {}
};
