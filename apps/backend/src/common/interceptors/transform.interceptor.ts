import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, successResponse } from '../types/api-response.type';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the data is already wrapped in ApiResponse shape, pass through
        if (
          data &&
          typeof data === 'object' &&
          'success' in (data as object) &&
          'data' in (data as object)
        ) {
          return data as unknown as ApiResponse<T>;
        }
        return successResponse(data);
      }),
    );
  }
}
