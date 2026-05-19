import { describe, it, expect } from 'vitest';
import { TrestleError } from '../src/errors.js';

describe('TrestleError', () => {
  it('carries kind, message, and http_status', () => {
    const err = new TrestleError('auth', 'Invalid API key', 401);
    expect(err.kind).toBe('auth');
    expect(err.message).toBe('Invalid API key');
    expect(err.http_status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });

  it('http_status is undefined for network errors', () => {
    const err = new TrestleError('network', 'ECONNREFUSED');
    expect(err.http_status).toBeUndefined();
  });

  it('toContent returns MCP-shaped error content', () => {
    const err = new TrestleError('rate_limit', 'Slow down', 429);
    expect(err.toContent()).toEqual({
      kind: 'rate_limit',
      message: 'Slow down',
      http_status: 429,
    });
  });
});
