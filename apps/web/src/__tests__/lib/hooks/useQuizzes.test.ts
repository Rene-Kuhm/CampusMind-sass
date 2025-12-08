import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuizzes } from '@/lib/hooks/useQuizzes';
import { quizzes as quizzesApi } from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  quizzes: {
    list: jest.fn(),
    get: jest.fn(),
    getForTaking: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    publish: jest.fn(),
    addQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    submit: jest.fn(),
    getAttempts: jest.fn(),
    getStats: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    token: 'test-token',
    user: { id: '1', email: 'test@example.com' },
  }),
}));

const mockQuizzesApi = quizzesApi as jest.Mocked<typeof quizzesApi>;

describe('useQuizzes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });

      const { result } = renderHook(() => useQuizzes());

      expect(result.current.quizzes).toEqual([]);
      expect(result.current.currentQuiz).toBeNull();
      expect(result.current.attempts).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadQuizzes', () => {
    it('should load quizzes successfully', async () => {
      const mockQuizzes = [
        { id: '1', title: 'Quiz 1', questions: [], status: 'published' },
        { id: '2', title: 'Quiz 2', questions: [], status: 'draft' },
      ];

      mockQuizzesApi.list.mockResolvedValue(mockQuizzes);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 2,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.quizzes).toEqual(mockQuizzes);
      });

      expect(mockQuizzesApi.list).toHaveBeenCalledWith('test-token', undefined);
    });

    it('should load quizzes filtered by subject', async () => {
      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.loadQuizzes('subject1');
      });

      expect(mockQuizzesApi.list).toHaveBeenCalledWith('test-token', 'subject1');
    });

    it('should handle load error', async () => {
      mockQuizzesApi.list.mockRejectedValue(new Error('Network error'));
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.error).toBe('Error loading quizzes');
      });
    });
  });

  describe('createQuiz', () => {
    it('should create a new quiz', async () => {
      const newQuiz = {
        id: '3',
        title: 'New Quiz',
        description: 'Test description',
        questions: [],
        status: 'draft',
      };

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.create.mockResolvedValue(newQuiz);

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const created = await result.current.createQuiz({
          title: 'New Quiz',
          description: 'Test description',
        });
        expect(created).toEqual(newQuiz);
      });

      expect(result.current.quizzes).toContainEqual(newQuiz);
    });
  });

  describe('updateQuiz', () => {
    it('should update an existing quiz', async () => {
      const existingQuizzes = [
        { id: '1', title: 'Old Title', questions: [], status: 'draft' },
      ];
      const updatedQuiz = { id: '1', title: 'New Title', questions: [], status: 'draft' };

      mockQuizzesApi.list.mockResolvedValue(existingQuizzes);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 1,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.update.mockResolvedValue(updatedQuiz);

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.quizzes).toEqual(existingQuizzes);
      });

      await act(async () => {
        const updated = await result.current.updateQuiz('1', { title: 'New Title' });
        expect(updated).toEqual(updatedQuiz);
      });

      expect(result.current.quizzes[0].title).toBe('New Title');
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz', async () => {
      const existingQuizzes = [
        { id: '1', title: 'Quiz 1', questions: [], status: 'draft' },
        { id: '2', title: 'Quiz 2', questions: [], status: 'draft' },
      ];

      mockQuizzesApi.list.mockResolvedValue(existingQuizzes);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 2,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.delete.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.quizzes).toHaveLength(2);
      });

      await act(async () => {
        const deleted = await result.current.deleteQuiz('1');
        expect(deleted).toBe(true);
      });

      expect(result.current.quizzes).toHaveLength(1);
      expect(result.current.quizzes[0].id).toBe('2');
    });
  });

  describe('publishQuiz', () => {
    it('should publish a quiz', async () => {
      const draftQuiz = { id: '1', title: 'Quiz', questions: [{}], status: 'draft' };
      const publishedQuiz = { id: '1', title: 'Quiz', questions: [{}], status: 'published' };

      mockQuizzesApi.list.mockResolvedValue([draftQuiz]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 1,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.publish.mockResolvedValue(publishedQuiz);

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.quizzes[0].status).toBe('draft');
      });

      await act(async () => {
        const published = await result.current.publishQuiz('1');
        expect(published?.status).toBe('published');
      });

      expect(result.current.quizzes[0].status).toBe('published');
    });
  });

  describe('question operations', () => {
    it('should add a question to a quiz', async () => {
      const quiz = { id: '1', title: 'Quiz', questions: [], status: 'draft' };
      const newQuestion = {
        id: 'q1',
        text: 'What is 2+2?',
        type: 'multiple_choice',
        options: ['3', '4', '5'],
        correctAnswer: 1,
      };

      mockQuizzesApi.list.mockResolvedValue([quiz]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 1,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.get.mockResolvedValue(quiz);
      mockQuizzesApi.addQuestion.mockResolvedValue(newQuestion);

      const { result } = renderHook(() => useQuizzes());

      // Load the quiz first
      await act(async () => {
        await result.current.loadQuiz('1');
      });

      await act(async () => {
        const question = await result.current.addQuestion('1', {
          text: 'What is 2+2?',
          type: 'multiple_choice',
          options: ['3', '4', '5'],
          correctAnswer: 1,
        });
        expect(question).toEqual(newQuestion);
      });
    });

    it('should update a question', async () => {
      const existingQuestion = {
        id: 'q1',
        text: 'Old question',
        type: 'multiple_choice',
        options: ['A', 'B'],
        correctAnswer: 0,
      };
      const quiz = { id: '1', title: 'Quiz', questions: [existingQuestion], status: 'draft' };
      const updatedQuestion = { ...existingQuestion, text: 'New question' };

      mockQuizzesApi.list.mockResolvedValue([quiz]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 1,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.get.mockResolvedValue(quiz);
      mockQuizzesApi.updateQuestion.mockResolvedValue(updatedQuestion);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.loadQuiz('1');
      });

      await act(async () => {
        const question = await result.current.updateQuestion('1', 'q1', { text: 'New question' });
        expect(question?.text).toBe('New question');
      });
    });

    it('should delete a question', async () => {
      const question1 = { id: 'q1', text: 'Q1', type: 'multiple_choice', options: [], correctAnswer: 0 };
      const question2 = { id: 'q2', text: 'Q2', type: 'multiple_choice', options: [], correctAnswer: 0 };
      const quiz = { id: '1', title: 'Quiz', questions: [question1, question2], status: 'draft' };

      mockQuizzesApi.list.mockResolvedValue([quiz]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 1,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.get.mockResolvedValue(quiz);
      mockQuizzesApi.deleteQuestion.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.loadQuiz('1');
      });

      await act(async () => {
        const deleted = await result.current.deleteQuestion('1', 'q1');
        expect(deleted).toBe(true);
      });

      expect(result.current.currentQuiz?.questions).toHaveLength(1);
    });
  });

  describe('submitQuiz', () => {
    it('should submit quiz answers and get results', async () => {
      const mockAttempt = {
        id: 'attempt1',
        quizId: '1',
        score: 80,
        percentage: 80,
        passed: true,
        answers: [],
        completedAt: new Date().toISOString(),
      };

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.submit.mockResolvedValue(mockAttempt);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        const attempt = await result.current.submitQuiz('1', {
          answers: [
            { questionId: 'q1', selectedOption: 1 },
            { questionId: 'q2', selectedOption: 0 },
          ],
        });
        expect(attempt).toEqual(mockAttempt);
      });

      expect(result.current.attempts).toContainEqual(mockAttempt);
    });

    it('should handle submission error', async () => {
      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.submit.mockRejectedValue(new Error('Submission failed'));

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const attempt = await result.current.submitQuiz('1', { answers: [] });
        expect(attempt).toBeNull();
      });

      expect(result.current.error).toBe('Error submitting quiz');
    });
  });

  describe('loadAttempts', () => {
    it('should load quiz attempts', async () => {
      const mockAttempts = [
        { id: 'a1', quizId: '1', score: 80, percentage: 80, passed: true, answers: [], completedAt: '' },
        { id: 'a2', quizId: '1', score: 60, percentage: 60, passed: false, answers: [], completedAt: '' },
      ];

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.getAttempts.mockResolvedValue(mockAttempts);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.loadAttempts('1');
      });

      expect(result.current.attempts).toEqual(mockAttempts);
    });
  });

  describe('loadQuizForTaking', () => {
    it('should load quiz without answers for taking', async () => {
      const quizForTaking = {
        id: '1',
        title: 'Test Quiz',
        questions: [
          { id: 'q1', text: 'Question 1', type: 'multiple_choice', options: ['A', 'B', 'C'] },
        ],
        status: 'published',
      };

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.getForTaking.mockResolvedValue(quizForTaking);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        const quiz = await result.current.loadQuizForTaking('1');
        expect(quiz).toEqual(quizForTaking);
      });

      expect(result.current.currentQuiz).toEqual(quizForTaking);
    });
  });

  describe('stats', () => {
    it('should load stats', async () => {
      const mockStats = {
        totalQuizzes: 10,
        totalAttempts: 50,
        averageScore: 75,
        passRate: 80,
      };

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
    });
  });

  describe('helper functions', () => {
    it('should clear error', async () => {
      mockQuizzesApi.list.mockRejectedValue(new Error('Test error'));
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });

      const { result } = renderHook(() => useQuizzes());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear current quiz', async () => {
      const mockQuiz = { id: '1', title: 'Test', questions: [], status: 'draft' };

      mockQuizzesApi.list.mockResolvedValue([]);
      mockQuizzesApi.getStats.mockResolvedValue({
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
      });
      mockQuizzesApi.get.mockResolvedValue(mockQuiz);

      const { result } = renderHook(() => useQuizzes());

      await act(async () => {
        await result.current.loadQuiz('1');
      });

      expect(result.current.currentQuiz).toEqual(mockQuiz);

      act(() => {
        result.current.clearCurrentQuiz();
      });

      expect(result.current.currentQuiz).toBeNull();
    });
  });
});
