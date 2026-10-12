import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // bỏ field lạ
    forbidNonWhitelisted: true,   // báo lỗi nếu có field lạ
    transform: true,              // tự ép kiểu theo DTO
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestTimingInterceptor());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Task Manager API')
    .setDescription('API for authentication and task management')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();