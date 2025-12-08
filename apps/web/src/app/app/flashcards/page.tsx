'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject, rag } from '@/lib/api';
import { exportFlashcardsToPDF } from '@/lib/pdf-export';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Brain,
  Plus,
  Play,
  Trash2,
  Edit3,
  Save,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  Layers,
  Sparkles,
  BookOpen,
  Zap,
  Award,
  Flame,
  Wand2,
  Loader2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Spaced repetition intervals (in days)
const SR_INTERVALS = [0, 1, 3, 7, 14, 30, 60];

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  level: number; // 0-6 for spaced repetition
  nextReview: string; // ISO date
  lastReviewed?: string;
  timesReviewed: number;
  timesCorrect: number;
  createdAt: string;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  color: string;
  createdAt: string;
  cardCount: number;
}

interface StudySession {
  deckId: string;
  cards: Flashcard[];
  currentIndex: number;
  correct: number;
  incorrect: number;
  startedAt: Date;
}

const DECK_COLORS = [
  { value: 'rose', label: 'Rosa', class: 'from-rose-500 to-pink-500' },
  { value: 'orange', label: 'Naranja', class: 'from-orange-500 to-amber-500' },
  { value: 'emerald', label: 'Verde', class: 'from-emerald-500 to-teal-500' },
  { value: 'blue', label: 'Azul', class: 'from-blue-500 to-cyan-500' },
  { value: 'violet', label: 'Violeta', class: 'from-violet-500 to-purple-500' },
  { value: 'pink', label: 'Magenta', class: 'from-pink-500 to-rose-500' },
];

function getColorClass(color: string): string {
  return DECK_COLORS.find(c => c.value === color)?.class || DECK_COLORS[0].class;
}

function getNextReviewDate(level: number): string {
  const date = new Date();
  date.setDate(date.getDate() + SR_INTERVALS[level]);
  return date.toISOString().split('T')[0];
}

function isDueForReview(card: Flashcard): boolean {
  const today = new Date().toISOString().split('T')[0];
  return card.nextReview <= today;
}

export default function FlashcardsPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Modal states
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [newDeck, setNewDeck] = useState<Partial<Deck>>({ name: '', color: 'blue' });
  const [newCard, setNewCard] = useState<Partial<Flashcard>>({ front: '', back: '' });

  // AI Generation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate');
  const [aiContent, setAiContent] = useState('');
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string }[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalCards: 0,
    cardsDueToday: 0,
    cardsStudiedToday: 0,
    streak: 0,
    masteredCards: 0,
  });

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  // Load decks and cards from localStorage
  useEffect(() => {
    const savedDecks = localStorage.getItem('flashcard-decks');
    const savedCards = localStorage.getItem('flashcard-cards');
    const savedStats = localStorage.getItem('flashcard-stats');

    if (savedDecks) setDecks(JSON.parse(savedDecks));
    if (savedCards) setCards(JSON.parse(savedCards));
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      const today = new Date().toISOString().split('T')[0];
      if (parsedStats.lastStudyDate !== today) {
        parsedStats.cardsStudiedToday = 0;
      }
      setStats(parsedStats);
    }
  }, []);

  // Update stats when cards change
  useEffect(() => {
    const totalCards = cards.length;
    const cardsDueToday = cards.filter(isDueForReview).length;
    const masteredCards = cards.filter(c => c.level >= 5).length;

    setStats(prev => ({
      ...prev,
      totalCards,
      cardsDueToday,
      masteredCards,
    }));
  }, [cards]);

  const saveDecks = (newDecks: Deck[]) => {
    setDecks(newDecks);
    localStorage.setItem('flashcard-decks', JSON.stringify(newDecks));
  };

  const saveCards = (newCards: Flashcard[]) => {
    setCards(newCards);
    localStorage.setItem('flashcard-cards', JSON.stringify(newCards));
  };

  const saveStats = (newStats: typeof stats) => {
    const statsToSave = {
      ...newStats,
      lastStudyDate: new Date().toISOString().split('T')[0],
    };
    setStats(newStats);
    localStorage.setItem('flashcard-stats', JSON.stringify(statsToSave));
  };

  // Deck operations
  const openNewDeckModal = () => {
    setEditingDeck(null);
    setNewDeck({ name: '', description: '', color: 'blue', subjectId: '' });
    setIsDeckModalOpen(true);
  };

  const openEditDeckModal = (deck: Deck) => {
    setEditingDeck(deck);
    setNewDeck({ ...deck });
    setIsDeckModalOpen(true);
  };

  const handleSaveDeck = () => {
    if (!newDeck.name) return;

    const deckToSave: Deck = {
      id: editingDeck?.id || Date.now().toString(),
      name: newDeck.name!,
      description: newDeck.description,
      subjectId: newDeck.subjectId,
      subjectName: subjects.find(s => s.id === newDeck.subjectId)?.name,
      color: newDeck.color || 'blue',
      createdAt: editingDeck?.createdAt || new Date().toISOString(),
      cardCount: editingDeck?.cardCount || 0,
    };

    let updatedDecks: Deck[];
    if (editingDeck) {
      updatedDecks = decks.map(d => d.id === editingDeck.id ? deckToSave : d);
    } else {
      updatedDecks = [...decks, deckToSave];
    }

    saveDecks(updatedDecks);
    setIsDeckModalOpen(false);
  };

  const handleDeleteDeck = (deckId: string) => {
    saveDecks(decks.filter(d => d.id !== deckId));
    saveCards(cards.filter(c => c.deckId !== deckId));
    if (selectedDeck?.id === deckId) setSelectedDeck(null);
  };

  // Card operations
  const openNewCardModal = () => {
    if (!selectedDeck) return;
    setEditingCard(null);
    setNewCard({ front: '', back: '', deckId: selectedDeck.id });
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: Flashcard) => {
    setEditingCard(card);
    setNewCard({ ...card });
    setIsCardModalOpen(true);
  };

  const handleSaveCard = () => {
    if (!newCard.front || !newCard.back || !selectedDeck) return;

    const cardToSave: Flashcard = {
      id: editingCard?.id || Date.now().toString(),
      front: newCard.front!,
      back: newCard.back!,
      deckId: selectedDeck.id,
      level: editingCard?.level || 0,
      nextReview: editingCard?.nextReview || getNextReviewDate(0),
      lastReviewed: editingCard?.lastReviewed,
      timesReviewed: editingCard?.timesReviewed || 0,
      timesCorrect: editingCard?.timesCorrect || 0,
      createdAt: editingCard?.createdAt || new Date().toISOString(),
    };

    let updatedCards: Flashcard[];
    if (editingCard) {
      updatedCards = cards.map(c => c.id === editingCard.id ? cardToSave : c);
    } else {
      updatedCards = [...cards, cardToSave];
      // Update deck card count
      saveDecks(decks.map(d =>
        d.id === selectedDeck.id ? { ...d, cardCount: d.cardCount + 1 } : d
      ));
    }

    saveCards(updatedCards);
    setIsCardModalOpen(false);
    setNewCard({ front: '', back: '' });
  };

  const handleDeleteCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    saveCards(cards.filter(c => c.id !== cardId));
    saveDecks(decks.map(d =>
      d.id === card.deckId ? { ...d, cardCount: Math.max(0, d.cardCount - 1) } : d
    ));
  };

  // AI Generation
  const openAIGenerateModal = () => {
    if (!selectedDeck) return;
    setAiTopic('');
    setAiCount(5);
    setAiDifficulty('intermediate');
    setAiContent('');
    setGeneratedCards([]);
    setIsAIGenerateModalOpen(true);
  };

  const handleGenerateWithAI = async () => {
    if (!aiTopic || !token || !selectedDeck) return;

    setAiGenerating(true);
    try {
      const response = await rag.generateFlashcards(token, {
        topic: aiTopic,
        count: aiCount,
        difficulty: aiDifficulty,
        content: aiContent || undefined,
      });

      if (response.flashcards && response.flashcards.length > 0) {
        setGeneratedCards(response.flashcards);
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddGeneratedCards = () => {
    if (!selectedDeck || generatedCards.length === 0) return;

    const newCards: Flashcard[] = generatedCards.map((gc, index) => ({
      id: `${Date.now()}-${index}`,
      front: gc.front,
      back: gc.back,
      deckId: selectedDeck.id,
      level: 0,
      nextReview: getNextReviewDate(0),
      timesReviewed: 0,
      timesCorrect: 0,
      createdAt: new Date().toISOString(),
    }));

    const updatedCards = [...cards, ...newCards];
    saveCards(updatedCards);
    saveDecks(decks.map(d =>
      d.id === selectedDeck.id ? { ...d, cardCount: d.cardCount + newCards.length } : d
    ));

    setIsAIGenerateModalOpen(false);
    setGeneratedCards([]);
  };

  const handleRemoveGeneratedCard = (index: number) => {
    setGeneratedCards(prev => prev.filter((_, i) => i !== index));
  };

  // Export to PDF
  const handleExportToPDF = () => {
    if (!selectedDeck || deckCards.length === 0) return;
    exportFlashcardsToPDF(selectedDeck.name, deckCards.map(c => ({
      front: c.front,
      back: c.back,
      level: c.level,
    })));
  };

  // Study session
  const startStudySession = (deck: Deck) => {
    const deckCards = cards.filter(c => c.deckId === deck.id && isDueForReview(c));
    if (deckCards.length === 0) {
      // If no cards due, study all cards
      const allDeckCards = cards.filter(c => c.deckId === deck.id);
      if (allDeckCards.length === 0) return;
      setStudySession({
        deckId: deck.id,
        cards: shuffleArray([...allDeckCards]),
        currentIndex: 0,
        correct: 0,
        incorrect: 0,
        startedAt: new Date(),
      });
    } else {
      setStudySession({
        deckId: deck.id,
        cards: shuffleArray([...deckCards]),
        currentIndex: 0,
        correct: 0,
        incorrect: 0,
        startedAt: new Date(),
      });
    }
    setIsFlipped(false);
  };

  const handleAnswer = (correct: boolean) => {
    if (!studySession) return;

    const currentCard = studySession.cards[studySession.currentIndex];

    // Update card with spaced repetition
    const newLevel = correct
      ? Math.min(currentCard.level + 1, SR_INTERVALS.length - 1)
      : Math.max(currentCard.level - 1, 0);

    const updatedCard: Flashcard = {
      ...currentCard,
      level: newLevel,
      nextReview: getNextReviewDate(newLevel),
      lastReviewed: new Date().toISOString(),
      timesReviewed: currentCard.timesReviewed + 1,
      timesCorrect: currentCard.timesCorrect + (correct ? 1 : 0),
    };

    saveCards(cards.map(c => c.id === currentCard.id ? updatedCard : c));

    // Update session
    const newSession = {
      ...studySession,
      currentIndex: studySession.currentIndex + 1,
      correct: studySession.correct + (correct ? 1 : 0),
      incorrect: studySession.incorrect + (correct ? 0 : 1),
    };

    // Update stats
    saveStats({
      ...stats,
      cardsStudiedToday: stats.cardsStudiedToday + 1,
      streak: stats.streak + (correct ? 1 : 0),
    });

    if (newSession.currentIndex >= studySession.cards.length) {
      // Session complete - keep session to show results
      setStudySession(newSession);
    } else {
      setStudySession(newSession);
      setIsFlipped(false);
    }
  };

  const endStudySession = () => {
    setStudySession(null);
    setIsFlipped(false);
  };

  const deckCards = selectedDeck ? cards.filter(c => c.deckId === selectedDeck.id) : [];
  const dueCards = deckCards.filter(isDueForReview);

  const subjectOptions = [
    { value: '', label: 'Sin materia' },
    ...subjects.map(s => ({ value: s.id, label: s.name })),
  ];

  // Study Mode View
  if (studySession) {
    const isComplete = studySession.currentIndex >= studySession.cards.length;
    const currentCard = !isComplete ? studySession.cards[studySession.currentIndex] : null;
    const progress = (studySession.currentIndex / studySession.cards.length) * 100;
    const deck = decks.find(d => d.id === studySession.deckId);

    if (isComplete) {
      const accuracy = studySession.cards.length > 0
        ? Math.round((studySession.correct / studySession.cards.length) * 100)
        : 0;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary-50 via-white to-violet-50">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                ¡Sesión completada!
              </h2>
              <p className="text-secondary-500 mb-6">
                Has estudiado {studySession.cards.length} tarjetas
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">{studySession.correct}</p>
                  <p className="text-xs text-emerald-600">Correctas</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl">
                  <p className="text-2xl font-bold text-rose-600">{studySession.incorrect}</p>
                  <p className="text-xs text-rose-600">Incorrectas</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{accuracy}%</p>
                  <p className="text-xs text-blue-600">Precisión</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={endStudySession}>
                  Volver
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={() => startStudySession(deck!)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Estudiar de nuevo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-violet-50">
        {/* Study Header */}
        <div className="p-4 flex items-center justify-between border-b border-secondary-200/50 bg-white/80 backdrop-blur-sm">
          <button
            onClick={endStudySession}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <X className="h-5 w-5" />
            <span>Salir</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-500">
              {studySession.currentIndex + 1} / {studySession.cards.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-medium">{studySession.correct}</span>
              <span className="text-secondary-300">/</span>
              <span className="text-rose-600 font-medium">{studySession.incorrect}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-secondary-100">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className="w-full max-w-lg perspective-1000"
            onClick={() => !isFlipped && setIsFlipped(true)}
          >
            <div
              className={cn(
                'relative w-full aspect-[4/3] transition-transform duration-500 transform-style-preserve-3d cursor-pointer',
                isFlipped && 'rotate-y-180'
              )}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden border-2 border-secondary-100"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <Badge variant="secondary" className="mb-4">Pregunta</Badge>
                <p className="text-xl font-medium text-secondary-900 text-center">
                  {currentCard?.front}
                </p>
                <p className="text-sm text-secondary-400 mt-6">
                  Toca para ver la respuesta
                </p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-primary-500 to-violet-500 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <Badge className="mb-4 bg-white/20 text-white">Respuesta</Badge>
                <p className="text-xl font-medium text-white text-center">
                  {currentCard?.back}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Answer buttons */}
        {isFlipped && (
          <div className="p-6 flex justify-center gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="flex items-center gap-2 px-8 py-4 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
            >
              <XCircle className="h-5 w-5" />
              No lo sabía
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex items-center gap-2 px-8 py-4 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              ¡Lo sabía!
            </button>
          </div>
        )}
      </div>
    );
  }

  // Deck Detail View
  if (selectedDeck) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className={cn(
          "relative overflow-hidden border-b border-secondary-200/50",
          `bg-gradient-to-r from-${selectedDeck.color}-50/80 via-white to-${selectedDeck.color}-50/80`
        )}>
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedDeck(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a mazos
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                  `bg-gradient-to-br ${getColorClass(selectedDeck.color)}`
                )}>
                  <Layers className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">
                    {selectedDeck.name}
                  </h1>
                  <p className="text-secondary-500 mt-0.5">
                    {deckCards.length} tarjetas · {dueCards.length} para repasar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {deckCards.length > 0 && (
                  <Button variant="outline" onClick={handleExportToPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                )}
                <Button variant="outline" onClick={() => openEditDeckModal(selectedDeck)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {deckCards.length > 0 && (
                  <Button variant="gradient" onClick={() => startStudySession(selectedDeck)}>
                    <Play className="h-4 w-4 mr-2" />
                    Estudiar ({dueCards.length > 0 ? dueCards.length : deckCards.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Add Card Buttons */}
            <div className="flex gap-3 mb-6">
              <Button variant="outline" className="flex-1" onClick={openNewCardModal}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar tarjeta
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={openAIGenerateModal}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generar con IA
                <Badge className="ml-2 bg-white/20 text-white text-xs">IA</Badge>
              </Button>
            </div>

            {/* Cards List */}
            {deckCards.length === 0 ? (
              <EmptyState
                icon={<Brain className="h-8 w-8" />}
                title="Sin tarjetas"
                description="Agrega tu primera tarjeta para empezar a estudiar"
              />
            ) : (
              <div className="space-y-3">
                {deckCards.map(card => (
                  <Card
                    key={card.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openEditCardModal(card)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-secondary-400 mb-1">Pregunta</p>
                              <p className="text-secondary-900 truncate">{card.front}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-400 mb-1">Respuesta</p>
                              <p className="text-secondary-700 truncate">{card.back}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isDueForReview(card) ? 'warning' : 'success'}
                            className="text-xs"
                          >
                            Nivel {card.level}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(card.id);
                            }}
                            className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Modal */}
        <Modal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          title={editingCard ? 'Editar tarjeta' : 'Nueva tarjeta'}
          variant="glass"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Pregunta (Frente) *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="¿Qué quieres recordar?"
                value={newCard.front || ''}
                onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Respuesta (Reverso) *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="La respuesta correcta"
                value={newCard.back || ''}
                onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button variant="outline" onClick={() => setIsCardModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSaveCard}
                disabled={!newCard.front || !newCard.back}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCard ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* AI Generate Modal */}
        <Modal
          isOpen={isAIGenerateModalOpen}
          onClose={() => setIsAIGenerateModalOpen(false)}
          title="Generar Flashcards con IA"
          variant="glass"
          size="lg"
        >
          <div className="space-y-6">
            {generatedCards.length === 0 ? (
              <>
                {/* Generation Form */}
                <div className="p-4 bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl border border-primary-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-primary-500" />
                    <span className="font-medium text-primary-700">Generación con IA</span>
                  </div>
                  <p className="text-sm text-primary-600">
                    Describe el tema y la IA generará flashcards automáticamente.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Tema *
                  </label>
                  <Input
                    placeholder="Ej: Leyes de Newton, Células eucariotas, Guerra Fría..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Cantidad de tarjetas
                    </label>
                    <Select
                      value={String(aiCount)}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      options={[
                        { value: '3', label: '3 tarjetas' },
                        { value: '5', label: '5 tarjetas' },
                        { value: '10', label: '10 tarjetas' },
                        { value: '15', label: '15 tarjetas' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Dificultad
                    </label>
                    <Select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as typeof aiDifficulty)}
                      options={[
                        { value: 'basic', label: 'Básico' },
                        { value: 'intermediate', label: 'Intermedio' },
                        { value: 'advanced', label: 'Avanzado' },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Contenido de referencia (opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Pega aquí texto de tus apuntes o material de estudio para generar flashcards basadas en ese contenido..."
                    value={aiContent}
                    onChange={(e) => setAiContent(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
                  <Button variant="outline" onClick={() => setIsAIGenerateModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleGenerateWithAI}
                    disabled={!aiTopic || aiGenerating}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Generar
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Generated Cards Preview */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-emerald-700">
                      {generatedCards.length} tarjetas generadas
                    </span>
                  </div>
                  <p className="text-sm text-emerald-600">
                    Revisa las tarjetas y elimina las que no necesites antes de agregarlas.
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-3">
                  {generatedCards.map((card, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="p-4">
                        <button
                          onClick={() => handleRemoveGeneratedCard(index)}
                          className="absolute top-2 right-2 p-1.5 text-secondary-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="grid grid-cols-2 gap-4 pr-6">
                          <div>
                            <p className="text-xs text-secondary-400 mb-1">Pregunta</p>
                            <p className="text-sm text-secondary-800">{card.front}</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-400 mb-1">Respuesta</p>
                            <p className="text-sm text-secondary-600">{card.back}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-secondary-100">
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedCards([])}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Regenerar
                  </Button>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsAIGenerateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="gradient"
                      onClick={handleAddGeneratedCards}
                      disabled={generatedCards.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar {generatedCards.length} tarjetas
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  // Main View - Deck List
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-pink-50/80 via-white to-rose-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">
                    Flashcards
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Aprende con repetición espaciada
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-pink-500" />
                  <span className="text-2xl font-bold text-secondary-900">{stats.totalCards}</span>
                </div>
                <p className="text-xs text-secondary-500">Total</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold text-secondary-900">{stats.cardsDueToday}</span>
                </div>
                <p className="text-xs text-secondary-500">Para hoy</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-secondary-900">{stats.masteredCards}</span>
                </div>
                <p className="text-xs text-secondary-500">Dominadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Create Deck Button */}
          <Button variant="gradient" className="mb-6" onClick={openNewDeckModal}>
            <Plus className="h-4 w-4 mr-2" />
            Crear mazo
          </Button>

          {/* Decks Grid */}
          {decks.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-8 w-8" />}
              title="Sin mazos"
              description="Crea tu primer mazo de flashcards para empezar a estudiar"
              action={
                <Button variant="gradient" onClick={openNewDeckModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear mazo
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map(deck => {
                const deckCardCount = cards.filter(c => c.deckId === deck.id).length;
                const deckDueCount = cards.filter(c => c.deckId === deck.id && isDueForReview(c)).length;

                return (
                  <Card
                    key={deck.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedDeck(deck)}
                  >
                    <div className={cn(
                      "h-2 bg-gradient-to-r",
                      getColorClass(deck.color)
                    )} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          `bg-gradient-to-br ${getColorClass(deck.color)}`
                        )}>
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDeckModal(deck);
                            }}
                            className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeck(deck.id);
                            }}
                            className="p-2 text-secondary-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-secondary-900 mb-1">{deck.name}</h3>
                      {deck.description && (
                        <p className="text-sm text-secondary-500 mb-3 line-clamp-2">
                          {deck.description}
                        </p>
                      )}
                      {deck.subjectName && (
                        <Badge variant="secondary" className="mb-3">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {deck.subjectName}
                        </Badge>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-secondary-500">
                            {deckCardCount} tarjetas
                          </span>
                          {deckDueCount > 0 && (
                            <span className="text-amber-600 font-medium">
                              {deckDueCount} para hoy
                            </span>
                          )}
                        </div>
                        {deckCardCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startStudySession(deck);
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deck Modal */}
      <Modal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
        title={editingDeck ? 'Editar mazo' : 'Nuevo mazo'}
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Nombre *
            </label>
            <Input
              placeholder="Nombre del mazo"
              value={newDeck.name || ''}
              onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="¿De qué trata este mazo?"
              value={newDeck.description || ''}
              onChange={(e) => setNewDeck({ ...newDeck, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Materia
              </label>
              <Select
                options={subjectOptions}
                value={newDeck.subjectId || ''}
                onChange={(e) => setNewDeck({ ...newDeck, subjectId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                {DECK_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setNewDeck({ ...newDeck, color: color.value })}
                    className={cn(
                      'w-8 h-8 rounded-lg transition-all',
                      `bg-gradient-to-br ${color.class}`,
                      newDeck.color === color.value
                        ? 'ring-2 ring-offset-2 ring-secondary-400 scale-110'
                        : 'hover:scale-105'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsDeckModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveDeck}
              disabled={!newDeck.name}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingDeck ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Utility function
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
