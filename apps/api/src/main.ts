import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
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

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CampusMind API')
    .setDescription(`
## API del copiloto académico integral para universitarios

CampusMind es una plataforma educativa que combina:
- **Flashcards con SM-2**: Sistema de repetición espaciada para memorización efectiva
- **Quizzes adaptativos**: Evaluaciones que se ajustan a tu nivel
- **Búsqueda académica**: Integración con bases de datos científicas
- **Motor RAG**: Consultas inteligentes sobre tus recursos
- **Gamificación**: Sistema de XP, logros y rachas

### Autenticación
La API usa JWT Bearer tokens. Incluye el header:
\`\`\`
Authorization: Bearer <tu_token>
\`\`\`

### Rate Limiting
- 100 requests por minuto para endpoints generales
- 10 requests por minuto para búsquedas académicas
    `)
    .setVersion('1.0.0')
    .setContact('CampusMind', 'https://campusmind.com', 'api@campusmind.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Desarrollo local')
    .addServer('https://api.campusmind.com', 'Producción')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('health', 'Health checks y monitoreo')
    .addTag('auth', 'Autenticación y gestión de usuarios')
    .addTag('subjects', 'Gestión de materias/workspaces')
    .addTag('flashcards', 'Flashcards con algoritmo SM-2')
    .addTag('quizzes', 'Quizzes y evaluaciones')
    .addTag('resources', 'Recursos académicos')
    .addTag('academic', 'Búsqueda en APIs académicas externas')
    .addTag('rag', 'Motor RAG - Consultas inteligentes')
    .addTag('calendar', 'Calendario y eventos')
    .addTag('billing', 'Suscripciones y pagos')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'CampusMind API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = configService.get<number>('API_PORT', 3001);
  await app.listen(port);

  console.log(`🚀 CampusMind API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
