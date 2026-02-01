import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import compression = require('compression');
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bodyParser: true,
  });

  // Increase payload size limit for quiz images
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Security
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }));
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://geatherlyy.vercel.app',
      'https://geatherlyy-git-main-heetmehta18s-projects.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global logging interceptor (Privacy: Mask sensitive data)
  app.useGlobalInterceptors(new LoggingInterceptor());

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Gatherly API')
      .setDescription('Centralized Club Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('clubs', 'Club management')
      .addTag('activities', 'Activity management')
      .addTag('quizzes', 'Quiz system')
      .addTag('leaderboards', 'Leaderboards')
      .addTag('resources', 'Resource sharing')
      .addTag('comments', 'Anonymous comments')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 5000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║     🚀 Gatherly API Server 🚀        ║
    ║                                       ║
    ║     Environment: ${process.env.NODE_ENV || 'development'}            ║
    ║     Port: ${port}                          ║
    ║     Docs: http://localhost:${port}/api/docs  ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
  `);
}

bootstrap();


