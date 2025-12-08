'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth-context';
import {
  flashcards as flashcardsApi,
  Flashcard,
  FlashcardDeck,
  FlashcardStats,
  CreateDeckRequest,
  CreateFlashcardRequest,
  ReviewFlashcardRequest,
} from '../api';

export function useFlashcards() {
  const { token } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all decks
  const loadDecks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await flashcardsApi.listDecks(token);
      setDecks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading decks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load cards for a specific deck
  const loadCards = useCallback(async (deckId: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [deckData, cardsData] = await Promise.all([
        flashcardsApi.getDeck(token, deckId),
        flashcardsApi.getCards(token, deckId),
      ]);
      setCurrentDeck(deckData);
      setCards(cardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading cards');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load due cards
  const loadDueCards = useCallback(async (deckId?: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await flashcardsApi.getDueCards(token, deckId);
      setDueCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading due cards');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load stats
  const loadStats = useCallback(async (deckId?: string) => {
    if (!token) return;
    try {
      const data = await flashcardsApi.getStats(token, deckId);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [token]);

  // Create deck
  const createDeck = useCallback(async (data: CreateDeckRequest) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const newDeck = await flashcardsApi.createDeck(token, data);
      setDecks(prev => [...prev, newDeck]);
      return newDeck;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating deck');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update deck
  const updateDeck = useCallback(async (deckId: string, data: Partial<CreateDeckRequest>) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const updatedDeck = await flashcardsApi.updateDeck(token, deckId, data);
      setDecks(prev => prev.map(d => d.id === deckId ? updatedDeck : d));
      if (currentDeck?.id === deckId) {
        setCurrentDeck(updatedDeck);
      }
      return updatedDeck;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating deck');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentDeck?.id]);

  // Delete deck
  const deleteDeck = useCallback(async (deckId: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      await flashcardsApi.deleteDeck(token, deckId);
      setDecks(prev => prev.filter(d => d.id !== deckId));
      if (currentDeck?.id === deckId) {
        setCurrentDeck(null);
        setCards([]);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting deck');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, currentDeck?.id]);

  // Create card
  const createCard = useCallback(async (data: CreateFlashcardRequest) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const newCard = await flashcardsApi.createCard(token, data);
      setCards(prev => [...prev, newCard]);
      return newCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating card');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update card
  const updateCard = useCallback(async (cardId: string, data: Partial<CreateFlashcardRequest>) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const updatedCard = await flashcardsApi.updateCard(token, cardId, data);
      setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
      return updatedCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating card');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Delete card
  const deleteCard = useCallback(async (cardId: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      await flashcardsApi.deleteCard(token, cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting card');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Review card (SM-2 algorithm)
  const reviewCard = useCallback(async (cardId: string, data: ReviewFlashcardRequest) => {
    if (!token) return null;
    try {
      const updatedCard = await flashcardsApi.reviewCard(token, cardId, data);
      // Remove from due cards
      setDueCards(prev => prev.filter(c => c.id !== cardId));
      // Update in cards list if present
      setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
      return updatedCard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reviewing card');
      return null;
    }
  }, [token]);

  // Import cards
  const importCards = useCallback(async (
    deckId: string,
    cardsData: Array<{ front: string; back: string; tags?: string[] }>
  ) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await flashcardsApi.importCards(token, deckId, cardsData);
      // Reload cards for the deck
      await loadCards(deckId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing cards');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, loadCards]);

  // Initial load
  useEffect(() => {
    if (token) {
      loadDecks();
      loadStats();
    }
  }, [token, loadDecks, loadStats]);

  return {
    // State
    decks,
    currentDeck,
    cards,
    dueCards,
    stats,
    loading,
    error,

    // Actions
    loadDecks,
    loadCards,
    loadDueCards,
    loadStats,
    createDeck,
    updateDeck,
    deleteDeck,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    importCards,

    // Helpers
    clearError: () => setError(null),
  };
}

export default useFlashcards;
