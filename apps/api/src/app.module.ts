import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { AcademicModule } from './modules/academic/academic.module';
import { RagModule } from './modules/rag/rag.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    SubjectsModule,
    ResourcesModule,
    AcademicModule,
    RagModule,
    CalendarModule,
    FlashcardsModule,
    QuizzesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
