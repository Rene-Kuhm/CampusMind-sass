import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PushNotificationService } from "./push.service";

describe("PushNotificationService", () => {
  let service: PushNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                VAPID_PUBLIC_KEY: "test-public-key-base64",
                VAPID_PRIVATE_KEY: "test-private-key-base64",
                VAPID_SUBJECT: "mailto:test@campusmind.com",
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
  });

  describe("getPublicKey", () => {
    it("should return VAPID public key", () => {
      const key = service.getPublicKey();
      expect(key).toBe("test-public-key-base64");
    });
  });

  describe("isEnabled", () => {
    it("should return true when VAPID keys are configured", () => {
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("subscribe", () => {
    it("should subscribe user to push notifications", async () => {
      const userId = "test-user-123";
      const subscription = {
        endpoint: "https://push.example.com/abc123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      };

      const result = await service.subscribe(userId, subscription);

      expect(result).toBe(true);
      expect(service.hasSubscription(userId)).toBe(true);
    });

    it("should not duplicate subscriptions with same endpoint", async () => {
      const userId = "duplicate-test";
      const subscription = {
        endpoint: "https://push.example.com/same-endpoint",
        keys: { p256dh: "key1", auth: "auth1" },
      };

      await service.subscribe(userId, subscription);
      await service.subscribe(userId, subscription);

      expect(service.hasSubscription(userId)).toBe(true);
    });
  });

  describe("unsubscribe", () => {
    it("should unsubscribe user from push notifications", async () => {
      const userId = "unsub-test";
      const subscription = {
        endpoint: "https://push.example.com/to-remove",
        keys: { p256dh: "key", auth: "auth" },
      };

      await service.subscribe(userId, subscription);
      expect(service.hasSubscription(userId)).toBe(true);

      await service.unsubscribe(userId);
      expect(service.hasSubscription(userId)).toBe(false);
    });

    it("should unsubscribe specific endpoint", async () => {
      const userId = "partial-unsub";
      const subscription1 = {
        endpoint: "https://push.example.com/endpoint1",
        keys: { p256dh: "key1", auth: "auth1" },
      };
      const subscription2 = {
        endpoint: "https://push.example.com/endpoint2",
        keys: { p256dh: "key2", auth: "auth2" },
      };

      await service.subscribe(userId, subscription1);
      await service.subscribe(userId, subscription2);

      await service.unsubscribe(userId, subscription1.endpoint);

      expect(service.hasSubscription(userId)).toBe(true);
    });
  });

  describe("hasSubscription", () => {
    it("should return false for user without subscription", () => {
      expect(service.hasSubscription("no-subscription-user")).toBe(false);
    });
  });

  describe("send", () => {
    it("should return success:false when user has no subscriptions", async () => {
      const result = await service.send({
        userId: "no-subscription",
        type: "study-reminder",
        payload: {
          title: "Test",
          body: "Test notification",
        },
      });

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
    });

    it("should send notification to subscribed user", async () => {
      const userId = "subscribed-user";
      await service.subscribe(userId, {
        endpoint: "https://push.example.com/valid",
        keys: { p256dh: "key", auth: "auth" },
      });

      const result = await service.send({
        userId,
        type: "study-reminder",
        payload: {
          title: "Study Reminder",
          body: "Time to study!",
        },
      });

      expect(result.success).toBe(true);
      expect(result.sent).toBe(1);
    });
  });

  describe("sendToMany", () => {
    it("should send notifications to multiple users", async () => {
      const users = ["user1", "user2", "user3"];

      for (const userId of users) {
        await service.subscribe(userId, {
          endpoint: `https://push.example.com/${userId}`,
          keys: { p256dh: "key", auth: "auth" },
        });
      }

      const result = await service.sendToMany(users, "achievement", {
        title: "Achievement!",
        body: "You did it!",
      });

      expect(result.total).toBe(3);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });
  });
});

describe("PushNotificationService - Convenience Methods", () => {
  let service: PushNotificationService;
  const testUserId = "convenience-test-user";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue("test-key"),
          },
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);

    // Subscribe test user
    await service.subscribe(testUserId, {
      endpoint: "https://push.example.com/test",
      keys: { p256dh: "key", auth: "auth" },
    });
  });

  describe("sendStudyReminder", () => {
    it("should send study reminder notification", async () => {
      const result = await service.sendStudyReminder(testUserId, {
        subjectName: "Matemáticas",
        pendingCards: 15,
        studyUrl: "https://campusmind.com/study",
      });

      expect(result).toBe(true);
    });
  });

  describe("sendStreakWarning", () => {
    it("should send streak warning notification", async () => {
      const result = await service.sendStreakWarning(testUserId, {
        currentStreak: 7,
        hoursRemaining: 3,
        studyUrl: "https://campusmind.com/study",
      });

      expect(result).toBe(true);
    });
  });

  describe("sendAchievementUnlocked", () => {
    it("should send achievement notification", async () => {
      const result = await service.sendAchievementUnlocked(testUserId, {
        achievementName: "Primera Racha",
        achievementIcon: "/icons/streak.png",
        xpEarned: 100,
        achievementsUrl: "https://campusmind.com/achievements",
      });

      expect(result).toBe(true);
    });
  });

  describe("sendNewComment", () => {
    it("should send new comment notification", async () => {
      const result = await service.sendNewComment(testUserId, {
        commenterName: "Juan",
        resourceName: "Notas de Física",
        commentPreview: "Excelente explicación sobre...",
        resourceUrl: "https://campusmind.com/resource/123",
      });

      expect(result).toBe(true);
    });
  });

  describe("sendCalendarReminder", () => {
    it("should send calendar reminder notification", async () => {
      const result = await service.sendCalendarReminder(testUserId, {
        eventTitle: "Examen de Cálculo",
        eventTime: "10:00 AM",
        minutesBefore: 30,
        calendarUrl: "https://campusmind.com/calendar",
      });

      expect(result).toBe(true);
    });
  });
});

describe("PushNotificationService - Disabled State", () => {
  let service: PushNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(""), // Empty keys = disabled
          },
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
  });

  it("should return false when checking if enabled", () => {
    expect(service.isEnabled()).toBe(false);
  });

  it("should return failure when trying to send", async () => {
    const result = await service.send({
      userId: "any-user",
      type: "study-reminder",
      payload: { title: "Test", body: "Test" },
    });

    expect(result.success).toBe(false);
  });
});
