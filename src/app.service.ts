import { Injectable, HttpException, HttpStatus, Logger  } from '@nestjs/common';
@Injectable()
export class AppService {
  private readonly logger = new Logger('HTTP');
  getHello(): string {
    return '<h1>Hello World! this is version 4 !!!!</h1>';
  }

  healthCheck(): string {
    this.logger.log('test')
    throw new HttpException("error", HttpStatus.INTERNAL_SERVER_ERROR)
    return '<h1>Hello World! this is version 4 !!!!</h1>';
  }
}
