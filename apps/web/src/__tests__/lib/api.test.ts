import { ApiError } from '@/lib/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('ApiError', () => {
    it('creates error with status code and message', () => {
      const error = new ApiError(404, 'Not found');

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.name).toBe('ApiError');
    });

    it('creates error with validation errors', () => {
      const errors = { email: ['Email is required'] };
      const error = new ApiError(400, 'Validation failed', errors);

      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(errors);
    });
  });

  describe('Auth endpoints', () => {
    it('should call login endpoint with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          user: { id: '1', email: 'test@example.com' },
          accessToken: 'token123',
        })),
      });

      const { auth } = await import('@/lib/api');
      const result = await auth.login({ email: 'test@example.com', password: 'password' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
        })
      );
      expect(result.accessToken).toBe('token123');
    });

    it('should throw ApiError on failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      const { auth } = await import('@/lib/api');

      await expect(auth.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('Flashcards endpoints', () => {
    it('should list decks with token', async () => {
      const mockDecks = [
        { id: '1', name: 'Deck 1', cardCount: 10 },
        { id: '2', name: 'Deck 2', cardCount: 5 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockDecks)),
      });

      const { flashcards } = await import('@/lib/api');
      const result = await flashcards.listDecks('token123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/flashcards/decks'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      );
      expect(result).toEqual(mockDecks);
    });

    it('should create deck', async () => {
      const newDeck = { id: '1', name: 'New Deck', color: '#FF0000' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(newDeck)),
      });

      const { flashcards } = await import('@/lib/api');
      const result = await flashcards.createDeck('token123', { name: 'New Deck', color: '#FF0000' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/flashcards/decks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Deck', color: '#FF0000' }),
        })
      );
      expect(result).toEqual(newDeck);
    });

    it('should review card with SM-2 data', async () => {
      const updatedCard = { id: '1', interval: 3, easeFactor: 2.6 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(updatedCard)),
      });

      const { flashcards } = await import('@/lib/api');
      const result = await flashcards.reviewCard('token123', 'card1', { quality: 4 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/flashcards/cards/card1/review'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ quality: 4 }),
        })
      );
      expect(result).toEqual(updatedCard);
    });
  });

  describe('Quizzes endpoints', () => {
    it('should list quizzes', async () => {
      const mockQuizzes = [
        { id: '1', title: 'Quiz 1', questions: [] },
        { id: '2', title: 'Quiz 2', questions: [] },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockQuizzes)),
      });

      const { quizzes } = await import('@/lib/api');
      const result = await quizzes.list('token123');

      expect(result).toEqual(mockQuizzes);
    });

    it('should submit quiz answers', async () => {
      const mockAttempt = {
        id: 'attempt1',
        score: 80,
        percentage: 80,
        passed: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAttempt)),
      });

      const { quizzes } = await import('@/lib/api');
      const result = await quizzes.submit('token123', 'quiz1', {
        answers: [{ questionId: 'q1', selectedOption: 0 }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/quizzes/quiz1/submit'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result.passed).toBe(true);
    });
  });

  describe('Password Reset endpoints', () => {
    it('should request password reset', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Email sent' })),
      });

      const { passwordReset } = await import('@/lib/api');
      const result = await passwordReset.requestReset('test@example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
      expect(result.message).toBe('Email sent');
    });

    it('should validate reset token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ valid: true })),
      });

      const { passwordReset } = await import('@/lib/api');
      const result = await passwordReset.validateToken('test@example.com', 'token123');

      expect(result.valid).toBe(true);
    });

    it('should reset password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ message: 'Password reset successfully' })),
      });

      const { passwordReset } = await import('@/lib/api');
      const result = await passwordReset.resetPassword('test@example.com', 'token123', 'newPassword123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            token: 'token123',
            newPassword: 'newPassword123',
          }),
        })
      );
      expect(result.message).toBe('Password reset successfully');
    });
  });

  describe('Dashboard endpoints', () => {
    it('should get dashboard stats', async () => {
      const mockStats = {
        subjects: 5,
        flashcards: 100,
        quizzes: 10,
        streakDays: 7,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockStats)),
      });

      const { dashboard } = await import('@/lib/api');
      const result = await dashboard.getStats('token123');

      expect(result.streakDays).toBe(7);
    });
  });
});
