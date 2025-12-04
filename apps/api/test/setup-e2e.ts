import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Helper to create a test application
export async function createTestApp(module: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(module).compile();

  const app = moduleFixture.createNestApplication();

  // Apply same pipes as production
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

// Clean up helper
export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
}
