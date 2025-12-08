import { renderHook, act, waitFor } from '@testing-library/react';
import { useFlashcards } from '@/lib/hooks/useFlashcards';
import { flashcards as flashcardsApi } from '@/lib/api';

// Mock the API module
jest.mock('@/lib/api', () => ({
  flashcards: {
    listDecks: jest.fn(),
    getDeck: jest.fn(),
    createDeck: jest.fn(),
    updateDeck: jest.fn(),
    deleteDeck: jest.fn(),
    getCards: jest.fn(),
    createCard: jest.fn(),
    updateCard: jest.fn(),
    deleteCard: jest.fn(),
    getDueCards: jest.fn(),
    reviewCard: jest.fn(),
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

const mockFlashcardsApi = flashcardsApi as jest.Mocked<typeof flashcardsApi>;

describe('useFlashcards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });

      const { result } = renderHook(() => useFlashcards());

      expect(result.current.decks).toEqual([]);
      expect(result.current.currentDeck).toBeNull();
      expect(result.current.cards).toEqual([]);
      expect(result.current.dueCards).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadDecks', () => {
    it('should load decks successfully', async () => {
      const mockDecks = [
        { id: '1', name: 'Deck 1', color: '#FF0000', cardCount: 10 },
        { id: '2', name: 'Deck 2', color: '#00FF00', cardCount: 5 },
      ];

      mockFlashcardsApi.listDecks.mockResolvedValue(mockDecks);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 2,
        totalCards: 15,
        cardsReviewedToday: 0,
        streakDays: 0,
      });

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.decks).toEqual(mockDecks);
      });

      expect(mockFlashcardsApi.listDecks).toHaveBeenCalledWith('test-token');
    });

    it('should handle load decks error', async () => {
      mockFlashcardsApi.listDecks.mockRejectedValue(new Error('Network error'));
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('createDeck', () => {
    it('should create a new deck', async () => {
      const newDeck = { id: '3', name: 'New Deck', color: '#0000FF', cardCount: 0 };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.createDeck.mockResolvedValue(newDeck);

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const created = await result.current.createDeck({ name: 'New Deck', color: '#0000FF' });
        expect(created).toEqual(newDeck);
      });

      expect(mockFlashcardsApi.createDeck).toHaveBeenCalledWith('test-token', {
        name: 'New Deck',
        color: '#0000FF',
      });
    });
  });

  describe('updateDeck', () => {
    it('should update an existing deck', async () => {
      const existingDecks = [{ id: '1', name: 'Old Name', color: '#FF0000', cardCount: 5 }];
      const updatedDeck = { id: '1', name: 'New Name', color: '#00FF00', cardCount: 5 };

      mockFlashcardsApi.listDecks.mockResolvedValue(existingDecks);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 1,
        totalCards: 5,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.updateDeck.mockResolvedValue(updatedDeck);

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.decks).toEqual(existingDecks);
      });

      await act(async () => {
        const updated = await result.current.updateDeck('1', { name: 'New Name', color: '#00FF00' });
        expect(updated).toEqual(updatedDeck);
      });

      expect(result.current.decks[0].name).toBe('New Name');
    });
  });

  describe('deleteDeck', () => {
    it('should delete a deck', async () => {
      const existingDecks = [
        { id: '1', name: 'Deck 1', color: '#FF0000', cardCount: 5 },
        { id: '2', name: 'Deck 2', color: '#00FF00', cardCount: 3 },
      ];

      mockFlashcardsApi.listDecks.mockResolvedValue(existingDecks);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 2,
        totalCards: 8,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.deleteDeck.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.decks).toHaveLength(2);
      });

      await act(async () => {
        const deleted = await result.current.deleteDeck('1');
        expect(deleted).toBe(true);
      });

      expect(result.current.decks).toHaveLength(1);
      expect(result.current.decks[0].id).toBe('2');
    });
  });

  describe('loadDeck', () => {
    it('should load a specific deck', async () => {
      const mockDeck = { id: '1', name: 'Test Deck', color: '#FF0000', cardCount: 10 };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.getDeck.mockResolvedValue(mockDeck);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        const deck = await result.current.loadDeck('1');
        expect(deck).toEqual(mockDeck);
      });

      expect(result.current.currentDeck).toEqual(mockDeck);
    });
  });

  describe('card operations', () => {
    it('should create a card', async () => {
      const newCard = {
        id: '1',
        front: 'Question',
        back: 'Answer',
        deckId: 'deck1',
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
      };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.createCard.mockResolvedValue(newCard);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        const card = await result.current.createCard('deck1', { front: 'Question', back: 'Answer' });
        expect(card).toEqual(newCard);
      });

      expect(mockFlashcardsApi.createCard).toHaveBeenCalledWith('test-token', 'deck1', {
        front: 'Question',
        back: 'Answer',
      });
    });

    it('should load cards for a deck', async () => {
      const mockCards = [
        { id: '1', front: 'Q1', back: 'A1', deckId: 'deck1', interval: 1, easeFactor: 2.5, repetitions: 1 },
        { id: '2', front: 'Q2', back: 'A2', deckId: 'deck1', interval: 0, easeFactor: 2.5, repetitions: 0 },
      ];

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.getCards.mockResolvedValue(mockCards);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        await result.current.loadCards('deck1');
      });

      expect(result.current.cards).toEqual(mockCards);
    });
  });

  describe('review operations', () => {
    it('should load due cards', async () => {
      const dueCards = [
        { id: '1', front: 'Q1', back: 'A1', deckId: 'deck1', interval: 0, easeFactor: 2.5, repetitions: 0 },
      ];

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.getDueCards.mockResolvedValue(dueCards);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        await result.current.loadDueCards('deck1');
      });

      expect(result.current.dueCards).toEqual(dueCards);
    });

    it('should review a card with SM-2 algorithm', async () => {
      const reviewedCard = {
        id: '1',
        front: 'Q1',
        back: 'A1',
        deckId: 'deck1',
        interval: 6,
        easeFactor: 2.6,
        repetitions: 2,
      };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.reviewCard.mockResolvedValue(reviewedCard);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        const card = await result.current.reviewCard('1', { quality: 4 });
        expect(card).toEqual(reviewedCard);
      });

      expect(mockFlashcardsApi.reviewCard).toHaveBeenCalledWith('test-token', '1', { quality: 4 });
    });
  });

  describe('stats', () => {
    it('should load stats', async () => {
      const mockStats = {
        totalDecks: 5,
        totalCards: 100,
        cardsReviewedToday: 20,
        streakDays: 7,
      };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
    });
  });

  describe('helper functions', () => {
    it('should clear error', async () => {
      mockFlashcardsApi.listDecks.mockRejectedValue(new Error('Test error'));
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });

      const { result } = renderHook(() => useFlashcards());

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear current deck', async () => {
      const mockDeck = { id: '1', name: 'Test', color: '#FF0000', cardCount: 0 };

      mockFlashcardsApi.listDecks.mockResolvedValue([]);
      mockFlashcardsApi.getStats.mockResolvedValue({
        totalDecks: 0,
        totalCards: 0,
        cardsReviewedToday: 0,
        streakDays: 0,
      });
      mockFlashcardsApi.getDeck.mockResolvedValue(mockDeck);

      const { result } = renderHook(() => useFlashcards());

      await act(async () => {
        await result.current.loadDeck('1');
      });

      expect(result.current.currentDeck).toEqual(mockDeck);

      act(() => {
        result.current.clearCurrentDeck();
      });

      expect(result.current.currentDeck).toBeNull();
    });
  });
});
