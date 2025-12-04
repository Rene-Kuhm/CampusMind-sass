import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AcademicModule } from '@/modules/academic/academic.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PrismaService } from '@/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';

describe('AcademicController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  // Test data
  const testUser = {
    email: `academic-test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env.local', '.env'],
        }),
        DatabaseModule,
        AuthModule,
        AcademicModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Register and login test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (userId) {
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('GET /academic/search', () => {
    it('should search with default source (OpenAlex)', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'machine learning' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('source');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should search with Semantic Scholar source', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'deep learning', source: 'semantic_scholar' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.source).toBe('semantic_scholar');
    });

    it('should search with Crossref source', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'neural networks', source: 'crossref' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.source).toBe('crossref');
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'artificial intelligence', type: 'paper' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('should filter by year range', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'data science', yearFrom: 2020, yearTo: 2024 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('should filter open access only', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'computer science', openAccessOnly: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      // All items should be open access if filter works
      if (response.body.items.length > 0) {
        response.body.items.forEach((item: any) => {
          expect(item.isOpenAccess).toBe(true);
        });
      }
    });

    it('should handle pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'programming', page: 1, perPage: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.perPage).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('should fail without query parameter', async () => {
      await request(app.getHttpServer())
        .get('/academic/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'test' })
        .expect(401);
    });
  });

  describe('GET /academic/search/multi', () => {
    it('should search in multiple sources', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search/multi')
        .query({ q: 'machine learning' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalBySource');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return results from multiple sources', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search/multi')
        .query({ q: 'deep learning algorithms' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { totalBySource } = response.body;

      // At least one source should have results
      const hasResults = Object.values(totalBySource).some((count: any) => count > 0);
      expect(hasResults).toBe(true);
    });

    it('should handle pagination in multi-search', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/search/multi')
        .query({ q: 'computer vision', page: 1, perPage: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });
  });

  describe('GET /academic/resource/:source/:externalId', () => {
    it('should get resource by external ID from OpenAlex', async () => {
      // First search to get a valid ID
      const searchResponse = await request(app.getHttpServer())
        .get('/academic/search')
        .query({ q: 'deep learning', source: 'openalex' })
        .set('Authorization', `Bearer ${authToken}`);

      if (searchResponse.body.items && searchResponse.body.items.length > 0) {
        const externalId = searchResponse.body.items[0].externalId;

        const response = await request(app.getHttpServer())
          .get(`/academic/resource/openalex/${encodeURIComponent(externalId)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('externalId');
        expect(response.body).toHaveProperty('title');
      }
    });

    it('should handle non-existent resource gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/resource/openalex/non-existent-id-12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .get('/academic/resource/openalex/test-id')
        .expect(401);
    });
  });

  describe('GET /academic/recommendations', () => {
    it('should get recommendations based on topics', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/recommendations')
        .query({ topics: 'machine learning,deep learning' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should limit recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/recommendations')
        .query({ topics: 'algorithms', limit: 5 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    it('should filter open access recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/academic/recommendations')
        .query({ topics: 'data structures', openAccessOnly: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without topics', async () => {
      await request(app.getHttpServer())
        .get('/academic/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });
});
