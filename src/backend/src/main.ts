import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'https://aldevionhr.vercel.app',
    ],
    credentials: true,
  });

  // Health check
  app.get('/healthz', () => ({ status: 'ok', timestamp: new Date() }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`AldevionHR API running on port ${port}`);
}

bootstrap().catch(console.error);