import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { RequestWithId } from '../middleware/request-id.middleware.js';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = request.startedAt ?? process.hrtime.bigint();
    // Errors (including guard failures) are logged once by AllExceptionsFilter.
    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            JSON.stringify({
              event: 'http_request',
              method: request.method,
              path: request.originalUrl ?? request.url,
              requestId: request.requestId,
              statusCode: response.statusCode,
              durationMs: Number(
                (
                  Number(process.hrtime.bigint() - startedAt) / 1_000_000
                ).toFixed(2),
              ),
            }),
          );
        },
      }),
    );
  }
}
