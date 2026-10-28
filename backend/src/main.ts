import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RequestTimingInterceptor } from './common/interceptors/request-timing.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             
    forbidNonWhitelisted: true,   
    transform: true,              
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestTimingInterceptor());
 const corsOrigins = (
  process.env.CORS_ORIGIN ??
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

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