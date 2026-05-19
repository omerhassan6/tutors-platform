import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { errorResponse } from '../types/api-response.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL;
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      code = ErrorCode.VALIDATION_FAILED;
      const res = exception.getResponse() as any;
      message = Array.isArray(res?.message) ? res.message.join(', ') : res?.message ?? exception.message;
      details = Array.isArray(res?.message) ? res.message : undefined;
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = ErrorCode.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      code = ErrorCode.UNAUTHORIZED;
      message = exception.message;
    } else if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      code = ErrorCode.FORBIDDEN;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = res?.message ?? exception.message;
      if (status === HttpStatus.CONFLICT) code = ErrorCode.CONFLICT;
      else code = ErrorCode.INTERNAL;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, isProduction ? undefined : exception.stack);
    }

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        isProduction ? undefined : (exception instanceof Error ? exception.stack : String(exception)),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`);
    }

    response.status(status).json(errorResponse(code, message, details));
  }
}
