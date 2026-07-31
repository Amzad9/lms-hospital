import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  private readonly logger = new Logger(CatchEverythingFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Always log the full error so it appears in Docker logs
    if (isHttp && status < 500) {
      this.logger.warn(`[${status}] ${httpAdapter.getRequestUrl(ctx.getRequest())} — ${String(exception)}`);
    } else {
      this.logger.error(
        `[${status}] ${httpAdapter.getRequestUrl(ctx.getRequest())} — ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    let response: any = {};
    if (isHttp) {
      response = exception.getResponse();
    }

    // For non-HTTP (500) errors, include the real error message so you can debug
    const errorMessage =
      exception instanceof Error ? exception.message : String(exception);

    const responseBody = {
      statusCode: status,
      ...(typeof response === 'object' ? response : { message: response }),
      // Only expose internal error detail in non-production
      ...(status === 500 && process.env.NODE_ENV !== 'production'
        ? { error: errorMessage }
        : {}),
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}