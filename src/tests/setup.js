import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock base44 SDK
globalThis.base44 = {
  auth: {
    me: async () => ({ 
      id: 'test-user', 
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'employee'
    })
  },
  entities: {
    TimeEntry: {
      list: async () => [],
      filter: async () => [],
      create: async () => ({ id: '1' }),
      update: async () => ({ id: '1' })
    }
  }
};