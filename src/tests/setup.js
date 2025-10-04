// Test environment setup
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// NO mocking - integration tests need real fetch
// NO stubbed env vars - use real .env file