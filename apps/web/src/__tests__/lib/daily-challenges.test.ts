import {
  getDailyChallenges,
  getDailyProgress,
  updateChallengeProgress,
  getTimeUntilReset,
  areAllChallengesCompleted,
  getTotalXpAvailable,
  DIFFICULTY_LABELS,
} from '../../lib/daily-challenges';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Daily Challenges', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDailyChallenges', () => {
    it('should return 5 challenges', () => {
      const challenges = getDailyChallenges();
      expect(challenges).toHaveLength(5);
    });

    it('should return challenges with required properties', () => {
      const challenges = getDailyChallenges();

      challenges.forEach(challenge => {
        expect(challenge).toHaveProperty('id');
        expect(challenge).toHaveProperty('type');
        expect(challenge).toHaveProperty('title');
        expect(challenge).toHaveProperty('description');
        expect(challenge).toHaveProperty('xpReward');
        expect(challenge).toHaveProperty('requirement');
        expect(challenge).toHaveProperty('progress');
        expect(challenge).toHaveProperty('completed');
        expect(challenge).toHaveProperty('difficulty');
      });
    });

    it('should have valid difficulty levels', () => {
      const challenges = getDailyChallenges();
      const validDifficulties = Object.keys(DIFFICULTY_LABELS);

      challenges.forEach(challenge => {
        expect(validDifficulties).toContain(challenge.difficulty);
      });
    });

    it('should persist challenges for the same day', () => {
      const challenges1 = getDailyChallenges();
      const challenges2 = getDailyChallenges();

      expect(challenges1.map(c => c.id)).toEqual(challenges2.map(c => c.id));
    });
  });

  describe('getDailyProgress', () => {
    it('should return default progress for new day', () => {
      const progress = getDailyProgress();

      expect(progress.challengesCompleted).toBe(0);
      expect(progress.totalChallenges).toBe(5);
      expect(progress.xpEarned).toBe(0);
      expect(progress.streak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateChallengeProgress', () => {
    it('should update challenge progress', () => {
      const challenges = getDailyChallenges();
      const challenge = challenges[0];

      const updated = updateChallengeProgress(challenge.id, 5);

      expect(updated).not.toBeNull();
      expect(updated?.progress).toBe(Math.min(5, challenge.requirement));
    });

    it('should mark challenge as completed when requirement met', () => {
      const challenges = getDailyChallenges();
      const challenge = challenges[0];

      const updated = updateChallengeProgress(challenge.id, challenge.requirement);

      expect(updated?.completed).toBe(true);
    });

    it('should return null for invalid challenge id', () => {
      const result = updateChallengeProgress('invalid-id', 5);
      expect(result).toBeNull();
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return a valid time string', () => {
      const time = getTimeUntilReset();
      expect(time).toMatch(/^\d+[hm]\s*\d*[m]?$/);
    });
  });

  describe('areAllChallengesCompleted', () => {
    it('should return false initially', () => {
      getDailyChallenges(); // Initialize
      expect(areAllChallengesCompleted()).toBe(false);
    });
  });

  describe('getTotalXpAvailable', () => {
    it('should return sum of all challenge XP rewards', () => {
      const challenges = getDailyChallenges();
      const expectedTotal = challenges.reduce((sum, c) => sum + c.xpReward, 0);

      expect(getTotalXpAvailable()).toBe(expectedTotal);
    });

    it('should return positive number', () => {
      expect(getTotalXpAvailable()).toBeGreaterThan(0);
    });
  });
});
