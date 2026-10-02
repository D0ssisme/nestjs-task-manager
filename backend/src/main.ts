import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // bỏ field lạ
    forbidNonWhitelisted: true,   // báo lỗi nếu có field lạ
    transform: true,              // tự ép kiểu theo DTO
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? false });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();