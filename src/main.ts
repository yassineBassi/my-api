import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptor/Logging.interceptor';
import { AllExceptionsFilter } from './interceptor/all-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['log', 'error', 'warn', 'debug'],
  });
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
