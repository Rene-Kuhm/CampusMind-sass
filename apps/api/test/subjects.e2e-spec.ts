import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { SubjectsModule } from '@/modules/subjects/subjects.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PrismaService } from '@/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';

describe('SubjectsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let createdSubjectId: string;

  // Test data
  const testUser = {
    email: `subjects-test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    career: 'Engineering',
    year: 3,
    university: 'Test University',
  };

  const testSubject = {
    name: 'Algoritmos y Estructuras de Datos',
    code: 'AED-101',
    description: 'Curso de algoritmos fundamentales',
    semester: '2024-1',
    professor: 'Dr. Test Professor',
    schedule: 'Lunes y Miércoles 10:00-12:00',
    credits: 6,
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
        SubjectsModule,
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
        await prisma.subject.deleteMany({ where: { userId } });
        await prisma.user.delete({ where: { id: userId } });
      }
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /subjects', () => {
    it('should create a new subject', async () => {
      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSubject)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testSubject.name);
      expect(response.body.code).toBe(testSubject.code);
      expect(response.body.credits).toBe(testSubject.credits);
      expect(response.body.isArchived).toBe(false);

      createdSubjectId = response.body.id;
    });

    it('should create subject with minimal data', async () => {
      const minimalSubject = {
        name: 'Minimal Subject',
      };

      const response = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalSubject)
        .expect(201);

      expect(response.body.name).toBe(minimalSubject.name);

      // Cleanup
      await prisma.subject.delete({ where: { id: response.body.id } });
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .post('/subjects')
        .send(testSubject)
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /subjects', () => {
    it('should list all subjects for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const subject = response.body.find((s: any) => s.id === createdSubjectId);
      expect(subject).toBeDefined();
      expect(subject.name).toBe(testSubject.name);
    });

    it('should not list archived subjects by default', async () => {
      // First archive a subject
      await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const archivedSubject = response.body.find(
        (s: any) => s.id === createdSubjectId,
      );
      expect(archivedSubject).toBeUndefined();

      // Unarchive for next tests
      await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should list archived subjects with query param', async () => {
      // Archive again
      await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/archive`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app.getHttpServer())
        .get('/subjects?includeArchived=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const archivedSubject = response.body.find(
        (s: any) => s.id === createdSubjectId,
      );
      expect(archivedSubject).toBeDefined();

      // Unarchive
      await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .get('/subjects')
        .expect(401);
    });
  });

  describe('GET /subjects/:id', () => {
    it('should get a specific subject', async () => {
      const response = await request(app.getHttpServer())
        .get(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdSubjectId);
      expect(response.body.name).toBe(testSubject.name);
    });

    it('should fail for non-existent subject', async () => {
      await request(app.getHttpServer())
        .get('/subjects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not access other user subjects', async () => {
      // Create another user
      const otherUser = {
        email: `other-${Date.now()}@example.com`,
        password: 'OtherPass123!',
        firstName: 'Other',
        lastName: 'User',
      };

      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(otherUser);

      const otherToken = registerRes.body.accessToken;

      // Try to access subject of first user
      await request(app.getHttpServer())
        .get(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      // Cleanup
      await prisma.user.delete({ where: { id: registerRes.body.user.id } });
    });
  });

  describe('PATCH /subjects/:id', () => {
    it('should update a subject', async () => {
      const updates = {
        name: 'Updated Subject Name',
        description: 'Updated description',
        credits: 8,
      };

      const response = await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.credits).toBe(updates.credits);
    });

    it('should fail for non-existent subject', async () => {
      await request(app.getHttpServer())
        .patch('/subjects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('PATCH /subjects/:id/archive and /unarchive', () => {
    it('should archive a subject', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isArchived).toBe(true);
    });

    it('should unarchive a subject', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/subjects/${createdSubjectId}/unarchive`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isArchived).toBe(false);
    });
  });

  describe('DELETE /subjects/:id', () => {
    it('should delete a subject', async () => {
      // Create a subject to delete
      const createRes = await request(app.getHttpServer())
        .post('/subjects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Subject to Delete' });

      const subjectToDelete = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/subjects/${subjectToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/subjects/${subjectToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail for non-existent subject', async () => {
      await request(app.getHttpServer())
        .delete('/subjects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
