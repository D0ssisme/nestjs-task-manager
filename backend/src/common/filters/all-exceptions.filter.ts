
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithId } from '../middleware/request-id.middleware.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message: exceptionResponse };

    const timestamp = new Date().toISOString();
    const requestId = request.requestId ?? 'unknown';
    const error = exception instanceof Error ? exception : undefined;

    // Structured log dạng JSON, có thể tìm kiếm bằng requestId.
    const logEntry = {
      event: 'http.exception',
      timestamp,
      requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: status,
      errorName: error?.name ?? 'UnknownError',
      errorMessage: error?.message ?? String(exception),
      stack: error?.stack ?? null,
    };

    this.logger.error(JSON.stringify(logEntry));

    // Không gửi stack trace nội bộ cho client.
    response.status(status).json({
      statusCode: status,
      timestamp,
      path: request.originalUrl ?? request.url,
      ...body,
      requestId,
    });
  }
}
