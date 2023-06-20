import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  constructor(private config: ConfigService) { }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const development = {
      code: status,
      path: req.url,
      method: req.method,
      timestamp: new Date().toLocaleDateString(),
      message: status !== HttpStatus.INTERNAL_SERVER_ERROR ? exception.message || null : 'Internal server error',
    };

    const production = {
      status: false,
      error: status !== HttpStatus.INTERNAL_SERVER_ERROR ? exception.message || null : 'Internal server error',
    };

    const response = this.config.get('NODE_ENV') === 'development' ? development : production;

    Logger.error(
      `${req.method} ${req.url}`,
      status === HttpStatus.INTERNAL_SERVER_ERROR ? exception.stack : JSON.stringify(response),
      'Custom Http Error Filter'
    );

    res.status(status).json(response);
  }
}
