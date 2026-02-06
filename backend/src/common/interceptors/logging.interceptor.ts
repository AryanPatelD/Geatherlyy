
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;

    this.logger.log(`Incoming Request: ${method} ${url}`);
    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = this.sanitize(body);
      const bodyString = JSON.stringify(sanitizedBody);
      // Truncate if too long (e.g., > 2KB)
      if (bodyString.length > 2048) {
        this.logger.debug(`Payload: ${bodyString.substring(0, 2048)}... (truncated)`);
      } else {
        this.logger.debug(`Payload: ${bodyString}`);
      }
    }

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => this.logger.log(`Request completed: ${method} ${url} in ${Date.now() - now}ms`)),
      );
  }

  private sanitize(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'authorization'];

    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '*****';
      }
    });

    return sanitized;
  }
}
