import {
  calculateSM2,
  SM2Response,
} from '../../lib/flashcards';

describe('Flashcards SM-2 Algorithm', () => {
  describe('calculateSM2', () => {
    it('should decrease interval and reset repetitions for "again" response', () => {
      const result = calculateSM2(SM2Response.AGAIN, 5, 2.5, 10);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should reset repetitions for "hard" response', () => {
      const result = calculateSM2(SM2Response.HARD, 5, 2.5, 10);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should increase interval for "good" response', () => {
      const result = calculateSM2(SM2Response.GOOD, 3, 2.5, 6);

      expect(result.repetitions).toBe(4);
      expect(result.interval).toBeGreaterThan(6);
    });

    it('should increase interval more for "easy" response', () => {
      const resultGood = calculateSM2(SM2Response.GOOD, 3, 2.5, 6);
      const resultEasy = calculateSM2(SM2Response.EASY, 3, 2.5, 6);

      expect(resultEasy.interval).toBeGreaterThan(resultGood.interval);
      expect(resultEasy.easeFactor).toBeGreaterThan(resultGood.easeFactor);
    });

    it('should not let ease factor go below 1.3', () => {
      // Multiple "again" responses should not reduce EF below 1.3
      let result = calculateSM2(SM2Response.AGAIN, 0, 1.5, 1);
      result = calculateSM2(SM2Response.AGAIN, result.repetitions, result.easeFactor, result.interval);
      result = calculateSM2(SM2Response.AGAIN, result.repetitions, result.easeFactor, result.interval);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should set interval to 1 for first repetition', () => {
      const result = calculateSM2(SM2Response.GOOD, 0, 2.5, 0);
      expect(result.interval).toBe(1);
    });

    it('should set interval to 6 for second repetition', () => {
      const result = calculateSM2(SM2Response.GOOD, 1, 2.5, 1);
      expect(result.interval).toBe(6);
    });
  });
});
