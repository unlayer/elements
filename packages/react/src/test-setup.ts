import '@testing-library/jest-dom';
import { afterEach } from 'vitest';

// Test setup for React Elements
// Global test utilities can be added here
// This file will be extended by the automation process

// Vitest's worker sends the main process each test's result and reads the answer only when its event loop is free,
// which it isn't between tests: a file's synchronous tests that run more than a minute together (the timing tests, on
// a slower CI runner) fail the run with `Timeout calling "onTaskUpdate"`, every test passing. A turn of the event loop
// after each test reads it. (The timer as it is here, before a test could replace it.)
const turn = globalThis.setImmediate;
afterEach(() => new Promise<void>((resolve) => turn(() => resolve())));
