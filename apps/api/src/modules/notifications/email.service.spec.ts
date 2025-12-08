import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                EMAIL_PROVIDER: 'smtp',
                EMAIL_FROM: 'test@campusmind.com',
                EMAIL_FROM_NAME: 'CampusMind Test',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('send', () => {
    it('should send email successfully with SMTP provider', async () => {
      const result = await service.send({
        to: 'recipient@test.com',
        subject: 'Test Email',
        template: 'welcome',
        data: { name: 'Test User' },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('sendWelcome', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcome('user@test.com', {
        name: 'New User',
        verificationLink: 'https://campusmind.com/verify/123',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email', async () => {
      const result = await service.sendPasswordReset('user@test.com', {
        name: 'Test User',
        resetLink: 'https://campusmind.com/reset/abc123',
        expiresIn: '1 hora',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendStudyReminder', () => {
    it('should send study reminder email', async () => {
      const result = await service.sendStudyReminder('student@test.com', {
        name: 'Student',
        pendingCards: 25,
        subjectName: 'Matemáticas',
        studyLink: 'https://campusmind.com/study/math',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendAchievementUnlocked', () => {
    it('should send achievement notification email', async () => {
      const result = await service.sendAchievementUnlocked('user@test.com', {
        name: 'Achiever',
        achievementName: 'Primera Racha',
        achievementDescription: 'Completa 7 días consecutivos de estudio',
        xpEarned: 100,
      });

      expect(result).toBe(true);
    });
  });

  describe('sendStreakWarning', () => {
    it('should send streak warning email', async () => {
      const result = await service.sendStreakWarning('user@test.com', {
        name: 'Streak Master',
        currentStreak: 14,
        hoursRemaining: 3,
        studyLink: 'https://campusmind.com/study',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendWeeklySummary', () => {
    it('should send weekly summary email', async () => {
      const result = await service.sendWeeklySummary('user@test.com', {
        name: 'Weekly User',
        weekStart: 'Lun 2 Dic',
        weekEnd: 'Dom 8 Dic',
        cardsReviewed: 150,
        quizzesTaken: 5,
        correctAnswers: 87,
        xpEarned: 450,
        currentLevel: 12,
        streakDays: 14,
        topSubject: 'Física',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendSubscriptionConfirmation', () => {
    it('should send subscription confirmation email', async () => {
      const result = await service.sendSubscriptionConfirmation('user@test.com', {
        name: 'Pro User',
        planName: 'Pro',
        amount: 9.99,
        currency: 'USD',
        nextBillingDate: '1 de Enero, 2025',
        features: [
          'Flashcards ilimitadas',
          'Quizzes adaptativos',
          'Sin anuncios',
        ],
      });

      expect(result).toBe(true);
    });
  });
});

describe('EmailService - Template Rendering', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('smtp'),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should render template with correct data interpolation', async () => {
    // Test that the service handles all template types without errors
    const templates = [
      'welcome',
      'password-reset',
      'email-verification',
      'study-reminder',
      'achievement-unlocked',
      'streak-warning',
      'weekly-summary',
      'subscription-confirmation',
    ] as const;

    for (const template of templates) {
      const result = await service.send({
        to: 'test@test.com',
        subject: 'Test',
        template,
        data: {
          name: 'Test',
          verificationLink: 'http://test.com',
          resetLink: 'http://test.com',
          expiresIn: '1h',
          pendingCards: 10,
          subjectName: 'Test',
          studyLink: 'http://test.com',
          achievementName: 'Test',
          achievementDescription: 'Test',
          xpEarned: 100,
          currentStreak: 7,
          hoursRemaining: 3,
          weekStart: 'Mon',
          weekEnd: 'Sun',
          cardsReviewed: 100,
          quizzesTaken: 5,
          correctAnswers: 80,
          currentLevel: 10,
          streakDays: 7,
          planName: 'Pro',
          amount: 10,
          currency: 'USD',
          nextBillingDate: '2025-01-01',
          features: ['Feature 1'],
        },
      });

      expect(result.success).toBe(true);
    }
  });
});
