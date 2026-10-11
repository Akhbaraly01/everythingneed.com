import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest does not auto-cleanup RTL when globals are disabled.
afterEach(() => {
    cleanup();
    localStorage.clear();
});
