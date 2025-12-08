'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth-context';
import {
  quizzes as quizzesApi,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizStats,
  CreateQuizRequest,
  CreateQuestionRequest,
  SubmitQuizRequest,
} from '../api';

export function useQuizzes() {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all quizzes
  const loadQuizzes = useCallback(async (subjectId?: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.list(token, subjectId);
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quizzes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load a specific quiz
  const loadQuiz = useCallback(async (quizId: string) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.get(token, quizId);
      setCurrentQuiz(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load quiz for taking (without answers)
  const loadQuizForTaking = useCallback(async (quizId: string) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getForTaking(token, quizId);
      setCurrentQuiz(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load stats
  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await quizzesApi.getStats(token);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [token]);

  // Load attempts for a quiz
  const loadAttempts = useCallback(async (quizId: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getAttempts(token, quizId);
      setAttempts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading attempts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create quiz
  const createQuiz = useCallback(async (data: CreateQuizRequest) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const newQuiz = await quizzesApi.create(token, data);
      setQuizzes(prev => [...prev, newQuiz]);
      return newQuiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update quiz
  const updateQuiz = useCallback(async (quizId: string, data: Partial<CreateQuizRequest>) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const updatedQuiz = await quizzesApi.update(token, quizId, data);
      setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(updatedQuiz);
      }
      return updatedQuiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Delete quiz
  const deleteQuiz = useCallback(async (quizId: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.delete(token, quizId);
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting quiz');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Publish quiz
  const publishQuiz = useCallback(async (quizId: string) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const updatedQuiz = await quizzesApi.publish(token, quizId);
      setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(updatedQuiz);
      }
      return updatedQuiz;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error publishing quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Add question to quiz
  const addQuestion = useCallback(async (quizId: string, data: CreateQuestionRequest) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const newQuestion = await quizzesApi.addQuestion(token, quizId, data);
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(prev => prev ? {
          ...prev,
          questions: [...prev.questions, newQuestion],
        } : null);
      }
      return newQuestion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding question');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Update question
  const updateQuestion = useCallback(async (
    quizId: string,
    questionId: string,
    data: Partial<CreateQuestionRequest>
  ) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const updatedQuestion = await quizzesApi.updateQuestion(token, quizId, questionId, data);
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(prev => prev ? {
          ...prev,
          questions: prev.questions.map(q => q.id === questionId ? updatedQuestion : q),
        } : null);
      }
      return updatedQuestion;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating question');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Delete question
  const deleteQuestion = useCallback(async (quizId: string, questionId: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.deleteQuestion(token, quizId, questionId);
      if (currentQuiz?.id === quizId) {
        setCurrentQuiz(prev => prev ? {
          ...prev,
          questions: prev.questions.filter(q => q.id !== questionId),
        } : null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting question');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, currentQuiz?.id]);

  // Submit quiz
  const submitQuiz = useCallback(async (quizId: string, data: SubmitQuizRequest) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const attempt = await quizzesApi.submit(token, quizId, data);
      setAttempts(prev => [attempt, ...prev]);
      return attempt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting quiz');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (token) {
      loadQuizzes();
      loadStats();
    }
  }, [token, loadQuizzes, loadStats]);

  return {
    // State
    quizzes,
    currentQuiz,
    attempts,
    stats,
    loading,
    error,

    // Actions
    loadQuizzes,
    loadQuiz,
    loadQuizForTaking,
    loadStats,
    loadAttempts,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    publishQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    submitQuiz,

    // Helpers
    clearError: () => setError(null),
    clearCurrentQuiz: () => setCurrentQuiz(null),
  };
}

export default useQuizzes;
