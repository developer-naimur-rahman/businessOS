import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error occurred.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as any;
        message = body.message || message;
        error = body.error || error;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors cleanly without leaking database internals
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'A record with this unique value already exists.';
          error = 'Conflict';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Requested record was not found.';
          error = 'Not Found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Foreign key constraint violated.';
          error = 'Bad Request';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed.';
          error = 'Bad Request';
          break;
      }
      this.logger.warn(`Prisma error [${exception.code}] on ${request.method} ${request.url}: ${exception.message}`);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided for database operation.';
      error = 'Validation Error';
      this.logger.warn(`Prisma validation error on ${request.method} ${request.url}: ${exception.message}`);
    } else if (
      (exception as any)?.type === 'entity.too.large' ||
      (exception as any)?.status === 413 ||
      (exception as any)?.name === 'PayloadTooLargeError'
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'ফাইলের আকার অনেক বড় (সর্বোচ্চ ৫০ মেগাবাইট অনুমোদিত)। অনুগ্রহ করে ছোট সাইজের ফাইল দিন। / Payload too large (Max 50MB allowed).';
      error = 'Payload Too Large';
      this.logger.warn(`Payload too large on ${request.method} ${request.url}`);
    } else {
      // General unexpected errors
      const err = exception as any;
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}: ${err?.message || exception}`,
        err?.stack,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
