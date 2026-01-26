import { Injectable, HttpException, HttpStatus  } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '<h1>Hello World! this is version 4 !!!!</h1>';
  }

  healthCheck(): string {
    throw HttpException("error", HttpStatus.INTERNAL_SERVER_ERROR)
    return '<h1>Hello World! this is version 4 !!!!</h1>';
  }
}
