import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export type RequestWithId = Request & {
  requestId: string;
  startedAt?: bigint;
};

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const incomingId = request.header('x-request-id');
    const requestId = incomingId && /^[A-Za-z0-9._:-]{1,128}$/.test(incomingId) ? incomingId : randomUUID();
    request.startedAt = process.hrtime.bigint();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
