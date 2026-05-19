import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { user?: { id?: string; sub?: string } }>();
    const response = ctx.getResponse<Response>();
    const { method, url } = request;
    const userId = request.user?.id ?? request.user?.sub ?? 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = response.statusCode;
        this.logger.log(`[${method}] ${url} ${statusCode} - ${duration}ms - user:${userId}`);
      }),
    );
  }
}
