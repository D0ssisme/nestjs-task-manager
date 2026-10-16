import { describe, expect, it, vi } from 'vitest';
import { RequestIdMiddleware } from './request-id.middleware.js';

describe('RequestIdMiddleware', () => {
  it('preserves a client request id and returns it in the response', () => {
    const middleware = new RequestIdMiddleware();
    const request = {
      header: vi.fn().mockReturnValue('client-request-123'),
    } as never;
    const response = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    middleware.use(request, response, next);

    expect(request.requestId).toBe('client-request-123');
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'client-request-123',
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it('generates a request id when the client does not provide one', () => {
    const middleware = new RequestIdMiddleware();
    const request = {
      header: vi.fn().mockReturnValue(undefined),
    } as never;
    const response = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    middleware.use(request, response, next);

    expect(request.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      request.requestId,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
