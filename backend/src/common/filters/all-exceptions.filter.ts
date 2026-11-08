import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import type { RequestWithId } from '../middleware/request-id.middleware.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithId>();
    const databaseCode =
      exception instanceof Prisma.PrismaClientKnownRequestError
        ? exception.code
        : undefined;
    const databaseErrors: Record<string, { status: number; message: string }> =
      {
        P2002: {
          status: HttpStatus.CONFLICT,
          message: 'A record with these values already exists',
        },
        P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
        P2003: {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid related record',
        },
      };
    const databaseError = databaseCode
      ? databaseErrors[databaseCode]
      : undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (databaseError?.status ?? HttpStatus.INTERNAL_SERVER_ERROR);
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: databaseError?.message ?? 'Internal server error' };
    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : { message: exceptionResponse };
    const errorMessage = this.getErrorMessage(body);
    const logEntry = {
      event: 'http_request',
      durationMs:
        request.startedAt === undefined
          ? 0
          : Number(
              (
                Number(process.hrtime.bigint() - request.startedAt) / 1_000_000
              ).toFixed(2),
            ),
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode: status,
      errorType:
        exception instanceof Error
          ? exception.constructor.name
          : 'UnknownError',
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

    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === 'string')
    ) {
      return message;
    }

    return 'Request failed';
  }
}
