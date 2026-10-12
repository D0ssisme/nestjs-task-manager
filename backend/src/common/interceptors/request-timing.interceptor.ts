import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestTimingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    if (this.isDocumentationRequest(request.path)) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(request, response.statusCode, startedAt);
        },
        error: (error: unknown) => {
          const statusCode = this.getErrorStatusCode(error) ?? response.statusCode;
          this.logRequest(request, statusCode, startedAt, error);
        },
      }),
    );
  }

  private isDocumentationRequest(path: string): boolean {
    return path === '/docs'
      || path.startsWith('/docs/')
      || path === '/api'
      || path.startsWith('/api/')
      || path === '/api-json';
  }

  private logRequest(
    request: Request,
    statusCode: number,
    startedAt: bigint,
    error?: unknown,
  ): void {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const entry = {
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };
    const message = JSON.stringify(entry);

    if (error) {
      this.logger.error(message);
      return;
    }

    this.logger.log(message);
  }

  private getErrorStatusCode(error: unknown): number | undefined {
    if (
      typeof error === 'object'
      && error !== null
      && 'getStatus' in error
      && typeof error.getStatus === 'function'
    ) {
      return error.getStatus();
    }

    return undefined;
  }
}
