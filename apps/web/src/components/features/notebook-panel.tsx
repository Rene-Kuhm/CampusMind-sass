'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from './audio-player';
import {
  notebook,
  NotebookGeneratedQuestion,
  NotebookGeneratedFlashcard,
  VoiceType,
  Resource,
} from '@/lib/api';
import {
  BookOpen,
  HelpCircle,
  Layers,
  Headphones,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lightbulb,
  Target,
  AlertTriangle,
  BookmarkCheck,
  Loader2,
  RefreshCw,
  Play,
} from 'lucide-react';

type TabType = 'guide' | 'questions' | 'flashcards' | 'podcast';

interface NotebookPanelProps {
  resource: Resource;
  token: string;
  className?: string;
}

interface StudyGuideData {
  summary: string;
  keyPoints: string[];
  concepts: Array<{ term: string; definition: string }>;
  studyTips: string[];
}

export function NotebookPanel({ resource, token, className }: NotebookPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('guide');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [studyGuide, setStudyGuide] = useState<StudyGuideData | null>(null);
  const [questions, setQuestions] = useState<NotebookGeneratedQuestion[]>([]);
  const [flashcards, setFlashcards] = useState<NotebookGeneratedFlashcard[]>([]);
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Flashcard state
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Voice selection
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('Kore');

  const tabs = [
    { id: 'guide' as TabType, label: 'Guía de Estudio', icon: BookOpen },
    { id: 'questions' as TabType, label: 'Preguntas', icon: HelpCircle },
    { id: 'flashcards' as TabType, label: 'Flashcards', icon: Layers },
    { id: 'podcast' as TabType, label: 'Podcast', icon: Headphones },
  ];

  const generateStudyGuide = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notebook.generateStudyGuide(token, resource.id);
      setStudyGuide({
        summary: result.summary,
        keyPoints: result.keyPoints,
        concepts: result.concepts,
        studyTips: result.studyTips,
      });
    } catch {
      setError('Error al generar la guía de estudio');
    } finally {
      setIsLoading(false);
    }
  }, [token, resource.id]);

  const generateQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notebook.generateQuestions(token, {
        resourceId: resource.id,
        count: 10,
        difficulty: 'mixed',
      });
      setQuestions(result.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCorrectCount(0);
    } catch {
      setError('Error al generar las preguntas');
    } finally {
      setIsLoading(false);
    }
  }, [token, resource.id]);

  const generateFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await notebook.generateFlashcards(token, {
        resourceId: resource.id,
        count: 15,
      });
      setFlashcards(result.flashcards);
      setCurrentFlashcardIndex(0);
      setIsFlipped(false);
    } catch {
      setError('Error al generar las flashcards');
    } finally {
      setIsLoading(false);
    }
  }, [token, resource.id]);

  const generatePodcast = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // First generate the script
      const scriptResult = await notebook.generatePodcastScript(token, {
        resourceId: resource.id,
        style: 'casual',
        duration: 'medium',
      });
      setPodcastScript(scriptResult.script);

      // Then generate the audio
      const audioUrl = await notebook.generatePodcastAudio(token, resource.id, {
        voice: selectedVoice,
        style: 'casual',
        duration: 'medium',
      });
      setPodcastUrl(audioUrl);
    } catch {
      setError('Error al generar el podcast. Asegúrate de que GEMINI_API_KEY esté configurada.');
    } finally {
      setIsLoading(false);
    }
  }, [token, resource.id, selectedVoice]);

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswer(answer);
    setShowExplanation(true);

    const currentQuestion = questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCorrectCount(0);
  };

  const nextFlashcard = () => {
    if (currentFlashcardIndex < flashcards.length - 1) {
      setCurrentFlashcardIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevFlashcard = () => {
    if (currentFlashcardIndex > 0) {
      setCurrentFlashcardIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const renderGuideTab = () => {
    if (!studyGuide) {
      return (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-primary-300 mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Guía de Estudio Inteligente
          </h3>
          <p className="text-secondary-500 mb-6 max-w-md mx-auto">
            Genera una guía completa con resumen, conceptos clave y tips de estudio
            basados en el contenido del recurso.
          </p>
          <Button
            variant="primary"
            onClick={generateStudyGuide}
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generar Guía
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Summary */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary-600" />
            <h4 className="font-semibold text-secondary-900">Resumen</h4>
          </div>
          <p className="text-secondary-700 leading-relaxed">{studyGuide.summary}</p>
        </div>

        {/* Key Points */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-secondary-900">Puntos Clave</h4>
          </div>
          <ul className="space-y-2">
            {studyGuide.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-primary-500 mt-1 flex-shrink-0" />
                <span className="text-secondary-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concepts */}
        {studyGuide.concepts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookmarkCheck className="w-5 h-5 text-violet-500" />
              <h4 className="font-semibold text-secondary-900">Conceptos Importantes</h4>
            </div>
            <div className="grid gap-3">
              {studyGuide.concepts.map((concept, index) => (
                <div
                  key={index}
                  className="bg-secondary-50 rounded-xl p-4 border border-secondary-100"
                >
                  <span className="font-medium text-secondary-900">{concept.term}:</span>{' '}
                  <span className="text-secondary-700">{concept.definition}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study Tips */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-secondary-900">Tips de Estudio</h4>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <ul className="space-y-2">
              {studyGuide.studyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-green-800">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-secondary-100">
          <Button
            variant="outline"
            size="sm"
            onClick={generateStudyGuide}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerar Guía
          </Button>
        </div>
      </div>
    );
  };

  const renderQuestionsTab = () => {
    if (questions.length === 0) {
      return (
        <div className="text-center py-12">
          <HelpCircle className="w-16 h-16 mx-auto text-primary-300 mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Preguntas de Práctica
          </h3>
          <p className="text-secondary-500 mb-6 max-w-md mx-auto">
            Genera preguntas de opción múltiple, verdadero/falso y respuesta corta
            para practicar y evaluar tu comprensión.
          </p>
          <Button
            variant="primary"
            onClick={generateQuestions}
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generar Preguntas
          </Button>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const isQuizComplete = isLastQuestion && showExplanation;

    if (isQuizComplete) {
      const percentage = Math.round((correctCount / questions.length) * 100);
      return (
        <div className="text-center py-12">
          <div className={cn(
            'w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4',
            percentage >= 70 ? 'bg-green-100' : percentage >= 50 ? 'bg-amber-100' : 'bg-red-100'
          )}>
            <span className={cn(
              'text-3xl font-bold',
              percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
            )}>
              {percentage}%
            </span>
          </div>
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            {percentage >= 70 ? '¡Excelente!' : percentage >= 50 ? 'Buen intento' : 'Sigue practicando'}
          </h3>
          <p className="text-secondary-500 mb-6">
            Respondiste correctamente {correctCount} de {questions.length} preguntas
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={resetQuiz} leftIcon={<RotateCcw className="w-4 h-4" />}>
              Intentar de nuevo
            </Button>
            <Button variant="primary" onClick={generateQuestions} isLoading={isLoading}>
              Nuevas preguntas
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-secondary-500">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </span>
          <Badge variant={
            currentQuestion.difficulty === 'easy' ? 'success' :
            currentQuestion.difficulty === 'medium' ? 'warning' : 'danger'
          }>
            {currentQuestion.difficulty === 'easy' ? 'Fácil' :
             currentQuestion.difficulty === 'medium' ? 'Media' : 'Difícil'}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary-100 rounded-full mb-6">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="mb-6">
          <p className="text-lg font-medium text-secondary-900">{currentQuestion.question}</p>
        </div>

        {/* Options */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const letter = option.charAt(0);
              const isSelected = selectedAnswer === letter;
              const isCorrect = letter === currentQuestion.correctAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(letter)}
                  disabled={showExplanation}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all',
                    !showExplanation && 'hover:border-primary-300 hover:bg-primary-50',
                    isSelected && !showExplanation && 'border-primary-500 bg-primary-50',
                    showExplanation && isCorrect && 'border-green-500 bg-green-50',
                    showExplanation && isSelected && !isCorrect && 'border-red-500 bg-red-50',
                    !isSelected && !isCorrect && showExplanation && 'opacity-50'
                  )}
                >
                  <span className="text-secondary-700">{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {currentQuestion.type === 'true_false' && (
          <div className="flex gap-4 mb-6">
            {['Verdadero', 'Falso'].map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.correctAnswer;

              return (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showExplanation}
                  className={cn(
                    'flex-1 p-4 rounded-xl border-2 text-center font-medium transition-all',
                    !showExplanation && 'hover:border-primary-300 hover:bg-primary-50',
                    isSelected && !showExplanation && 'border-primary-500 bg-primary-50',
                    showExplanation && isCorrect && 'border-green-500 bg-green-50',
                    showExplanation && isSelected && !isCorrect && 'border-red-500 bg-red-50'
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* Explanation */}
        {showExplanation && (
          <div className={cn(
            'p-4 rounded-xl mb-6',
            selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-amber-50 border border-amber-200'
          )}>
            <div className="flex items-start gap-2">
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              )}
              <div>
                <p className="font-medium text-secondary-900 mb-1">
                  {selectedAnswer === currentQuestion.correctAnswer ? '¡Correcto!' : 'Incorrecto'}
                </p>
                <p className="text-sm text-secondary-700">{currentQuestion.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        {showExplanation && !isLastQuestion && (
          <Button variant="primary" onClick={nextQuestion} className="w-full">
            Siguiente pregunta
          </Button>
        )}
      </div>
    );
  };

  const renderFlashcardsTab = () => {
    if (flashcards.length === 0) {
      return (
        <div className="text-center py-12">
          <Layers className="w-16 h-16 mx-auto text-primary-300 mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Flashcards Inteligentes
          </h3>
          <p className="text-secondary-500 mb-6 max-w-md mx-auto">
            Genera tarjetas de estudio con conceptos clave, definiciones y fórmulas
            extraídas del contenido.
          </p>
          <Button
            variant="primary"
            onClick={generateFlashcards}
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generar Flashcards
          </Button>
        </div>
      );
    }

    const currentFlashcard = flashcards[currentFlashcardIndex];

    return (
      <div>
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-secondary-500">
            Tarjeta {currentFlashcardIndex + 1} de {flashcards.length}
          </span>
          <div className="flex gap-2">
            {currentFlashcard.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Flashcard */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={cn(
            'min-h-[250px] rounded-2xl p-8 cursor-pointer transition-all duration-500',
            'flex items-center justify-center text-center',
            isFlipped
              ? 'bg-gradient-to-br from-primary-500 to-violet-500 text-white'
              : 'bg-white border-2 border-secondary-200'
          )}
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div>
            <p className="text-sm uppercase tracking-wide mb-4 opacity-70">
              {isFlipped ? 'Respuesta' : 'Pregunta'}
            </p>
            <p className={cn(
              'text-xl font-medium',
              isFlipped ? 'text-white' : 'text-secondary-900'
            )}>
              {isFlipped ? currentFlashcard.back : currentFlashcard.front}
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-secondary-500 mt-4">
          Haz clic en la tarjeta para voltearla
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevFlashcard}
            disabled={currentFlashcardIndex === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentFlashcardIndex(0);
              setIsFlipped(false);
            }}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reiniciar
          </Button>
          <Button
            variant="outline"
            onClick={nextFlashcard}
            disabled={currentFlashcardIndex === flashcards.length - 1}
          >
            Siguiente
          </Button>
        </div>

        <div className="pt-6 border-t border-secondary-100 mt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateFlashcards}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Generar nuevas flashcards
          </Button>
        </div>
      </div>
    );
  };

  const renderPodcastTab = () => {
    if (!podcastUrl && !podcastScript) {
      return (
        <div className="text-center py-12">
          <Headphones className="w-16 h-16 mx-auto text-primary-300 mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">
            Podcast de Estudio
          </h3>
          <p className="text-secondary-500 mb-6 max-w-md mx-auto">
            Convierte tu material de estudio en un podcast de audio que puedes
            escuchar mientras haces otras cosas.
          </p>

          {/* Voice selector */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'] as VoiceType[]).map((voice) => (
              <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  selectedVoice === voice
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                )}
              >
                {voice}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            onClick={generatePodcast}
            isLoading={isLoading}
            leftIcon={<Play className="w-4 h-4" />}
          >
            Generar Podcast
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Audio Player */}
        <AudioPlayer
          src={podcastUrl || undefined}
          title={`Podcast: ${resource.title}`}
          subtitle={`Voz: ${selectedVoice}`}
          isLoading={isLoading && !podcastUrl}
        />

        {/* Script preview */}
        {podcastScript && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-secondary-900">Script del Podcast</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(podcastScript);
                }}
              >
                Copiar
              </Button>
            </div>
            <div className="bg-secondary-50 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                {podcastScript}
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-secondary-100">
          <Button
            variant="outline"
            size="sm"
            onClick={generatePodcast}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerar Podcast
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with tabs */}
      <div className="border-b border-secondary-100">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  'border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-secondary-500 hover:text-secondary-700'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {isLoading && activeTab !== 'podcast' && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        {!isLoading && activeTab === 'guide' && renderGuideTab()}
        {!isLoading && activeTab === 'questions' && renderQuestionsTab()}
        {!isLoading && activeTab === 'flashcards' && renderFlashcardsTab()}
        {activeTab === 'podcast' && renderPodcastTab()}
      </CardContent>
    </Card>
  );
}
