import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./common/redis";
import { AuthModule } from "./modules/auth/auth.module";
import { SubjectsModule } from "./modules/subjects/subjects.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { AcademicModule } from "./modules/academic/academic.module";
import { RagModule } from "./modules/rag/rag.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { FlashcardsModule } from "./modules/flashcards/flashcards.module";
import { QuizzesModule } from "./modules/quizzes/quizzes.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { GradesModule } from "./modules/grades/grades.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { StudySessionsModule } from "./modules/study-sessions/study-sessions.module";
import { HealthController } from "./health.controller";

// New feature modules - FASE 1
import { GoalsModule } from "./modules/goals/goals.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { CalendarSyncModule } from "./modules/calendar-sync/calendar-sync.module";

// New feature modules - FASE 2
import { GroupsModule } from "./modules/groups/groups.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { ForumsModule } from "./modules/forums/forums.module";
import { TutoringModule } from "./modules/tutoring/tutoring.module";

// New feature modules - FASE 3
import { BibliographyModule } from "./modules/bibliography/bibliography.module";
import { StudyPlansModule } from "./modules/study-plans/study-plans.module";
import { TranscriptionModule } from "./modules/transcription/transcription.module";
import { VideoSummaryModule } from "./modules/video-summary/video-summary.module";
import { EmailReportsModule } from "./modules/email-reports/email-reports.module";

// New feature modules - FASE 4
import { LmsModule } from "./modules/lms/lms.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
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

    // Redis cache (global)
    RedisModule.forRoot(),

    // Core feature modules
    AuthModule,
    SubjectsModule,
    ResourcesModule,
    AcademicModule,
    RagModule,
    CalendarModule,
    FlashcardsModule,
    QuizzesModule,
    BillingModule,
    NotificationsModule,
    GradesModule,
    TasksModule,
    StudySessionsModule,

    // FASE 1: Goals, Analytics, OCR, Calendar Sync
    GoalsModule,
    AnalyticsModule,
    OcrModule,
    CalendarSyncModule,

    // FASE 2: Social & Gamification
    GroupsModule,
    GamificationModule,
    ForumsModule,
    TutoringModule,

    // FASE 3: AI & Productivity
    BibliographyModule,
    StudyPlansModule,
    TranscriptionModule,
    VideoSummaryModule,
    EmailReportsModule,

    // FASE 4: External Integrations
    LmsModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
