import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
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
    const body = typeof exceptionResponse === 'object' && exceptionResponse !== null
      ? exceptionResponse
      : { message: exceptionResponse };
    const errorMessage = this.getErrorMessage(body);
    const logEntry = {
      event: 'http_request',
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: status,
      errorType: exception instanceof Error ? exception.constructor.name : 'UnknownError',
      message: errorMessage,
    };

    this.logger.error(JSON.stringify(logEntry));

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...body,
      requestId: request.requestId,
    });
  }

  private getErrorMessage(body: object): string | string[] {
    if (!('message' in body)) {
      return 'Internal server error';
    }

    const message = body.message;
    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message;
    }

    return 'Request failed';
  }
}
