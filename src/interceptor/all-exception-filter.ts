// all-exceptions.filter.ts
import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    Logger,
  } from '@nestjs/common';
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ERROR');
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest();
      const res = ctx.getResponse();
  
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : 500;
  
      this.logger.error(
        `${status} - ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : '',
      );
  
      res.status(status).json({
        statusCode: status,
        message: 'Internal server error',
      });
    }
  }