'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject } from '@/lib/api';
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
  ClipboardCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  BarChart3,
  Sparkles,
  BookOpen,
  AlertCircle,
  RotateCcw,
  ListChecks,
  HelpCircle,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Question types
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Index for MC, 'true'/'false' for TF, text for short
  explanation?: string;
  points: number;
}

interface Quiz {
  id: string;
  name: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  questions: Question[];
  timeLimit?: number; // In minutes, 0 = no limit
  passingScore: number; // Percentage
  createdAt: string;
  updatedAt: string;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  quizName: string;
  answers: Record<string, string | number>;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // In seconds
  completedAt: string;
}

interface QuizSession {
  quiz: Quiz;
  currentIndex: number;
  answers: Record<string, string | number>;
  startedAt: Date;
  timeRemaining?: number;
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: typeof HelpCircle }[] = [
  { value: 'multiple_choice', label: 'Opción múltiple', icon: ListChecks },
  { value: 'true_false', label: 'Verdadero/Falso', icon: CheckCircle },
  { value: 'short_answer', label: 'Respuesta corta', icon: Edit3 },
];

export default function QuizPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [showResults, setShowResults] = useState<QuizAttempt | null>(null);

  // Modal states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [newQuiz, setNewQuiz] = useState<Partial<Quiz>>({
    name: '',
    timeLimit: 0,
    passingScore: 60,
  });
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
  });

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  // Load quizzes and attempts from localStorage
  useEffect(() => {
    const savedQuizzes = localStorage.getItem('quizzes');
    const savedAttempts = localStorage.getItem('quiz-attempts');
    if (savedQuizzes) setQuizzes(JSON.parse(savedQuizzes));
    if (savedAttempts) setAttempts(JSON.parse(savedAttempts));
  }, []);

  // Timer effect
  useEffect(() => {
    if (quizSession && quizSession.quiz.timeLimit && quizSession.quiz.timeLimit > 0) {
      timerRef.current = setInterval(() => {
        setQuizSession(prev => {
          if (!prev || !prev.timeRemaining) return prev;
          if (prev.timeRemaining <= 1) {
            // Time's up - submit quiz
            handleSubmitQuiz();
            return null;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [quizSession?.quiz.id]);

  const saveQuizzes = (newQuizzes: Quiz[]) => {
    setQuizzes(newQuizzes);
    localStorage.setItem('quizzes', JSON.stringify(newQuizzes));
  };

  const saveAttempts = (newAttempts: QuizAttempt[]) => {
    setAttempts(newAttempts);
    localStorage.setItem('quiz-attempts', JSON.stringify(newAttempts));
  };

  // Quiz CRUD
  const openNewQuizModal = () => {
    setEditingQuiz(null);
    setNewQuiz({ name: '', description: '', timeLimit: 0, passingScore: 60, subjectId: '' });
    setIsQuizModalOpen(true);
  };

  const openEditQuizModal = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setNewQuiz({ ...quiz });
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = () => {
    if (!newQuiz.name) return;

    const quizToSave: Quiz = {
      id: editingQuiz?.id || Date.now().toString(),
      name: newQuiz.name!,
      description: newQuiz.description,
      subjectId: newQuiz.subjectId,
      subjectName: subjects.find(s => s.id === newQuiz.subjectId)?.name,
      questions: editingQuiz?.questions || [],
      timeLimit: newQuiz.timeLimit || 0,
      passingScore: newQuiz.passingScore || 60,
      createdAt: editingQuiz?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedQuizzes: Quiz[];
    if (editingQuiz) {
      updatedQuizzes = quizzes.map(q => q.id === editingQuiz.id ? quizToSave : q);
    } else {
      updatedQuizzes = [...quizzes, quizToSave];
    }

    saveQuizzes(updatedQuizzes);
    setIsQuizModalOpen(false);
    if (!editingQuiz) setSelectedQuiz(quizToSave);
  };

  const handleDeleteQuiz = (quizId: string) => {
    saveQuizzes(quizzes.filter(q => q.id !== quizId));
    if (selectedQuiz?.id === quizId) setSelectedQuiz(null);
  };

  // Question CRUD
  const openNewQuestionModal = () => {
    setEditingQuestion(null);
    setNewQuestion({
      type: 'multiple_choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 10,
    });
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setEditingQuestion(question);
    setNewQuestion({ ...question });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!newQuestion.question || !selectedQuiz) return;

    const questionToSave: Question = {
      id: editingQuestion?.id || Date.now().toString(),
      type: newQuestion.type as QuestionType,
      question: newQuestion.question!,
      options: newQuestion.type === 'multiple_choice' ? newQuestion.options : undefined,
      correctAnswer: newQuestion.correctAnswer!,
      explanation: newQuestion.explanation,
      points: newQuestion.points || 10,
    };

    let updatedQuestions: Question[];
    if (editingQuestion) {
      updatedQuestions = selectedQuiz.questions.map(q =>
        q.id === editingQuestion.id ? questionToSave : q
      );
    } else {
      updatedQuestions = [...selectedQuiz.questions, questionToSave];
    }

    const updatedQuiz = { ...selectedQuiz, questions: updatedQuestions, updatedAt: new Date().toISOString() };
    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);

    saveQuizzes(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!selectedQuiz) return;

    const updatedQuestions = selectedQuiz.questions.filter(q => q.id !== questionId);
    const updatedQuiz = { ...selectedQuiz, questions: updatedQuestions };
    const updatedQuizzes = quizzes.map(q => q.id === selectedQuiz.id ? updatedQuiz : q);

    saveQuizzes(updatedQuizzes);
    setSelectedQuiz(updatedQuiz);
  };

  // Quiz session
  const startQuiz = (quiz: Quiz) => {
    if (quiz.questions.length === 0) return;

    setQuizSession({
      quiz,
      currentIndex: 0,
      answers: {},
      startedAt: new Date(),
      timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : undefined,
    });
  };

  const handleAnswer = (questionId: string, answer: string | number) => {
    if (!quizSession) return;
    setQuizSession({
      ...quizSession,
      answers: { ...quizSession.answers, [questionId]: answer },
    });
  };

  const handleSubmitQuiz = useCallback(() => {
    if (!quizSession) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const { quiz, answers, startedAt } = quizSession;
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach(q => {
      totalPoints += q.points;
      const userAnswer = answers[q.id];

      if (q.type === 'short_answer') {
        // Case-insensitive comparison for short answers
        if (userAnswer && String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()) {
          score += q.points;
        }
      } else {
        if (userAnswer === q.correctAnswer) {
          score += q.points;
        }
      }
    });

    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const timeSpent = Math.round((new Date().getTime() - startedAt.getTime()) / 1000);

    const attempt: QuizAttempt = {
      id: Date.now().toString(),
      quizId: quiz.id,
      quizName: quiz.name,
      answers,
      score,
      totalPoints,
      percentage,
      passed: percentage >= quiz.passingScore,
      timeSpent,
      completedAt: new Date().toISOString(),
    };

    saveAttempts([attempt, ...attempts]);
    setShowResults(attempt);
    setQuizSession(null);
  }, [quizSession, attempts]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const subjectOptions = [
    { value: '', label: 'Sin materia' },
    ...subjects.map(s => ({ value: s.id, label: s.name })),
  ];

  // Stats
  const quizStats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0,
    passRate: attempts.length > 0
      ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100)
      : 0,
  };

  // Results View
  if (showResults) {
    const quiz = quizzes.find(q => q.id === showResults.quizId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <div className={cn(
              "p-8 text-center",
              showResults.passed
                ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                : "bg-gradient-to-br from-rose-500 to-orange-500"
            )}>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                {showResults.passed ? (
                  <Trophy className="h-10 w-10 text-white" />
                ) : (
                  <Target className="h-10 w-10 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {showResults.passed ? '¡Felicitaciones!' : 'Sigue practicando'}
              </h2>
              <p className="text-white/80">
                {showResults.passed
                  ? 'Has aprobado el examen'
                  : `Necesitas ${quiz?.passingScore}% para aprobar`}
              </p>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-secondary-50 rounded-xl">
                  <p className="text-3xl font-bold text-secondary-900">{showResults.percentage}%</p>
                  <p className="text-sm text-secondary-500">Puntuación</p>
                </div>
                <div className="text-center p-4 bg-secondary-50 rounded-xl">
                  <p className="text-3xl font-bold text-secondary-900">
                    {showResults.score}/{showResults.totalPoints}
                  </p>
                  <p className="text-sm text-secondary-500">Puntos</p>
                </div>
                <div className="text-center p-4 bg-secondary-50 rounded-xl">
                  <p className="text-3xl font-bold text-secondary-900">{formatTime(showResults.timeSpent)}</p>
                  <p className="text-sm text-secondary-500">Tiempo</p>
                </div>
              </div>

              {/* Review answers */}
              {quiz && (
                <div className="space-y-4 mb-8">
                  <h3 className="font-semibold text-secondary-900">Revisión de respuestas</h3>
                  {quiz.questions.map((q, idx) => {
                    const userAnswer = showResults.answers[q.id];
                    const isCorrect = q.type === 'short_answer'
                      ? String(userAnswer).toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()
                      : userAnswer === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "p-4 rounded-xl border-2",
                          isCorrect ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                          )}>
                            {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-secondary-900 mb-2">
                              {idx + 1}. {q.question}
                            </p>
                            <p className="text-sm">
                              <span className="text-secondary-500">Tu respuesta: </span>
                              <span className={isCorrect ? "text-emerald-700" : "text-rose-700"}>
                                {q.type === 'multiple_choice' && q.options
                                  ? q.options[userAnswer as number] || 'Sin respuesta'
                                  : String(userAnswer || 'Sin respuesta')}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-sm mt-1">
                                <span className="text-secondary-500">Correcta: </span>
                                <span className="text-emerald-700 font-medium">
                                  {q.type === 'multiple_choice' && q.options
                                    ? q.options[q.correctAnswer as number]
                                    : String(q.correctAnswer)}
                                </span>
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-sm text-secondary-600 mt-2 p-2 bg-white/50 rounded-lg">
                                {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowResults(null)}
                >
                  Volver
                </Button>
                {quiz && (
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => {
                      setShowResults(null);
                      startQuiz(quiz);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reintentar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Session View
  if (quizSession) {
    const { quiz, currentIndex, answers, timeRemaining } = quizSession;
    const currentQuestion = quiz.questions[currentIndex];
    const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-violet-50">
        {/* Header */}
        <div className="bg-white border-b border-secondary-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (confirm('¿Seguro que quieres abandonar? Perderás tu progreso.')) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setQuizSession(null);
                  }
                }}
                className="text-secondary-600 hover:text-secondary-900"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="font-semibold text-secondary-900">{quiz.name}</h2>
            </div>

            <div className="flex items-center gap-4">
              {timeRemaining !== undefined && (
                <Badge
                  variant={timeRemaining < 60 ? 'error' : timeRemaining < 300 ? 'warning' : 'secondary'}
                  className="text-base px-3 py-1"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeRemaining)}
                </Badge>
              )}
              <span className="text-secondary-600">
                {currentIndex + 1} / {quiz.questions.length}
              </span>
            </div>
          </div>
          <div className="max-w-3xl mx-auto mt-3">
            <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">
                    {QUESTION_TYPES.find(t => t.value === currentQuestion.type)?.label}
                  </Badge>
                  <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                </div>

                <h3 className="text-xl font-semibold text-secondary-900 mb-6">
                  {currentQuestion.question}
                </h3>

                {/* Answer options based on type */}
                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswer(currentQuestion.id, idx)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all",
                          answers[currentQuestion.id] === idx
                            ? "border-primary-500 bg-primary-50"
                            : "border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium",
                            answers[currentQuestion.id] === idx
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-secondary-300 text-secondary-500"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-secondary-900">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['true', 'false'].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAnswer(currentQuestion.id, value)}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all",
                          answers[currentQuestion.id] === value
                            ? "border-primary-500 bg-primary-50"
                            : "border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center",
                          value === 'true' ? "bg-emerald-100" : "bg-rose-100"
                        )}>
                          {value === 'true' ? (
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-rose-600" />
                          )}
                        </div>
                        <p className="text-center font-medium text-secondary-900">
                          {value === 'true' ? 'Verdadero' : 'Falso'}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'short_answer' && (
                  <Input
                    placeholder="Escribe tu respuesta..."
                    value={String(answers[currentQuestion.id] || '')}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    className="text-lg"
                  />
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-secondary-100">
                  <Button
                    variant="outline"
                    onClick={() => setQuizSession({ ...quizSession, currentIndex: currentIndex - 1 })}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>

                  {currentIndex < quiz.questions.length - 1 ? (
                    <Button
                      variant="gradient"
                      onClick={() => setQuizSession({ ...quizSession, currentIndex: currentIndex + 1 })}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      variant="gradient"
                      onClick={handleSubmitQuiz}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question navigator */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {quiz.questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setQuizSession({ ...quizSession, currentIndex: idx })}
                  className={cn(
                    "w-10 h-10 rounded-lg font-medium transition-all",
                    idx === currentIndex
                      ? "bg-primary-500 text-white"
                      : answers[q.id] !== undefined
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Detail View
  if (selectedQuiz) {
    const quizAttempts = attempts.filter(a => a.quizId === selectedQuiz.id);
    const bestScore = quizAttempts.length > 0
      ? Math.max(...quizAttempts.map(a => a.percentage))
      : 0;

    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedQuiz(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a quizzes
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <ClipboardCheck className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedQuiz.name}</h1>
                  <p className="text-secondary-500 mt-0.5">
                    {selectedQuiz.questions.length} preguntas
                    {selectedQuiz.timeLimit ? ` · ${selectedQuiz.timeLimit} min` : ''}
                    {` · ${selectedQuiz.passingScore}% para aprobar`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => openEditQuizModal(selectedQuiz)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                {selectedQuiz.questions.length > 0 && (
                  <Button variant="gradient" onClick={() => startQuiz(selectedQuiz)}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Quiz
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            {quizAttempts.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-secondary-500">Mejor puntuación</p>
                  <p className="text-2xl font-bold text-secondary-900">{bestScore}%</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-secondary-500">Intentos</p>
                  <p className="text-2xl font-bold text-secondary-900">{quizAttempts.length}</p>
                </div>
                <div className="bg-white/80 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-sm text-secondary-500">Aprobados</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {quizAttempts.filter(a => a.passed).length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-secondary-900">Preguntas</h2>
              <Button variant="outline" onClick={openNewQuestionModal}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar pregunta
              </Button>
            </div>

            {selectedQuiz.questions.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-8 w-8" />}
                title="Sin preguntas"
                description="Agrega preguntas para poder iniciar el quiz"
                action={
                  <Button variant="gradient" onClick={openNewQuestionModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar pregunta
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {selectedQuiz.questions.map((question, idx) => (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                            </Badge>
                            <Badge variant="secondary">{question.points} pts</Badge>
                          </div>
                          <p className="text-secondary-900 font-medium">{question.question}</p>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="mt-2 text-sm text-secondary-500">
                              Opciones: {question.options.filter(o => o).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditQuestionModal(question)}
                            className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
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

        {/* Question Modal */}
        <Modal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          title={editingQuestion ? 'Editar pregunta' : 'Nueva pregunta'}
          variant="glass"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Tipo de pregunta
                </label>
                <Select
                  options={QUESTION_TYPES.map(t => ({ value: t.value, label: t.label }))}
                  value={newQuestion.type || 'multiple_choice'}
                  onChange={(e) => setNewQuestion({
                    ...newQuestion,
                    type: e.target.value as QuestionType,
                    correctAnswer: e.target.value === 'true_false' ? 'true' : e.target.value === 'multiple_choice' ? 0 : '',
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Puntos
                </label>
                <Input
                  type="number"
                  value={newQuestion.points || 10}
                  onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Pregunta *
              </label>
              <textarea
                className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Escribe la pregunta..."
                value={newQuestion.question || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
              />
            </div>

            {newQuestion.type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Opciones (marca la correcta)
                </label>
                <div className="space-y-2">
                  {(newQuestion.options || ['', '', '', '']).map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: idx })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          newQuestion.correctAnswer === idx
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-secondary-300 hover:border-secondary-400"
                        )}
                      >
                        {newQuestion.correctAnswer === idx && <CheckCircle className="h-4 w-4" />}
                      </button>
                      <Input
                        placeholder={`Opción ${String.fromCharCode(65 + idx)}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(newQuestion.options || [])];
                          newOptions[idx] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: newOptions });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newQuestion.type === 'true_false' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Respuesta correcta
                </label>
                <div className="flex gap-4">
                  {['true', 'false'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: value })}
                      className={cn(
                        "flex-1 p-4 rounded-xl border-2 transition-colors",
                        newQuestion.correctAnswer === value
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-secondary-200 hover:border-secondary-300"
                      )}
                    >
                      {value === 'true' ? 'Verdadero' : 'Falso'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {newQuestion.type === 'short_answer' && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Respuesta correcta
                </label>
                <Input
                  placeholder="Respuesta esperada..."
                  value={String(newQuestion.correctAnswer || '')}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Explicación (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Explicación de la respuesta correcta..."
                value={newQuestion.explanation || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button variant="outline" onClick={() => setIsQuestionModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSaveQuestion}
                disabled={!newQuestion.question}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingQuestion ? 'Guardar' : 'Agregar'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Main View - Quiz List
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                <ClipboardCheck className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-violet-500">
                    Quiz
                  </span> & Exámenes
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Pon a prueba tus conocimientos
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  <span className="text-2xl font-bold text-secondary-900">{quizStats.totalAttempts}</span>
                </div>
                <p className="text-xs text-secondary-500">Intentos</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-secondary-900">{quizStats.averageScore}%</span>
                </div>
                <p className="text-xs text-secondary-500">Promedio</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold text-secondary-900">{quizStats.passRate}%</span>
                </div>
                <p className="text-xs text-secondary-500">Aprobados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="gradient" className="mb-6" onClick={openNewQuizModal}>
            <Plus className="h-4 w-4 mr-2" />
            Crear quiz
          </Button>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={<ClipboardCheck className="h-8 w-8" />}
              title="Sin quizzes"
              description="Crea tu primer quiz para evaluar tus conocimientos"
              action={
                <Button variant="gradient" onClick={openNewQuizModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear quiz
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map(quiz => {
                const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
                const bestScore = quizAttempts.length > 0
                  ? Math.max(...quizAttempts.map(a => a.percentage))
                  : null;

                return (
                  <Card
                    key={quiz.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                          <ClipboardCheck className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditQuizModal(quiz);
                            }}
                            className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuiz(quiz.id);
                            }}
                            className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-semibold text-secondary-900 mb-1">{quiz.name}</h3>
                      {quiz.description && (
                        <p className="text-sm text-secondary-500 mb-3 line-clamp-2">{quiz.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {quiz.subjectName && (
                          <Badge variant="secondary">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {quiz.subjectName}
                          </Badge>
                        )}
                        {quiz.timeLimit && quiz.timeLimit > 0 && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {quiz.timeLimit} min
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                        <span className="text-sm text-secondary-500">
                          {quiz.questions.length} preguntas
                        </span>
                        {bestScore !== null && (
                          <Badge variant={bestScore >= quiz.passingScore ? 'success' : 'warning'}>
                            Mejor: {bestScore}%
                          </Badge>
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

      {/* Quiz Modal */}
      <Modal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        title={editingQuiz ? 'Editar quiz' : 'Nuevo quiz'}
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Nombre *
            </label>
            <Input
              placeholder="Ej: Examen Capítulo 3"
              value={newQuiz.name || ''}
              onChange={(e) => setNewQuiz({ ...newQuiz, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="Descripción del quiz..."
              value={newQuiz.description || ''}
              onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Materia
              </label>
              <Select
                options={subjectOptions}
                value={newQuiz.subjectId || ''}
                onChange={(e) => setNewQuiz({ ...newQuiz, subjectId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tiempo límite (min)
              </label>
              <Input
                type="number"
                placeholder="0 = sin límite"
                value={newQuiz.timeLimit || ''}
                onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Puntuación para aprobar (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={newQuiz.passingScore || 60}
              onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: parseInt(e.target.value) || 60 })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsQuizModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSaveQuiz}
              disabled={!newQuiz.name}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingQuiz ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
