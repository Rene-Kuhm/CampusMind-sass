'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  Button,
  Select,
  Textarea,
  Badge,
  Spinner,
} from '@/components/ui';
import {
  subjects as subjectsApi,
  rag,
  Subject,
  RagResponse,
  Citation,
} from '@/lib/api';
import {
  Send,
  Sparkles,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  tokensUsed?: number;
  processingTimeMs?: number;
  timestamp: Date;
}

export default function CopilotPage() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subject');
  const { token } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || ''
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSubjects();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadSubjects() {
    if (!token) return;
    try {
      const data = await subjectsApi.list(token);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await rag.query(token, {
        query: input.trim(),
        subjectId: selectedSubjectId || undefined,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
        tokensUsed: response.tokensUsed,
        processingTimeMs: response.processingTimeMs,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error querying RAG:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const subjectOptions = [
    { value: '', label: 'Todas las materias' },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const exampleQuestions = [
    '¿Cuáles son los conceptos clave de este tema?',
    'Explícame esto con un ejemplo práctico',
    'Resúmeme las ideas principales',
    '¿Cuáles son los errores más comunes en exámenes?',
    'Dame una lista de definiciones importantes',
  ];

  return (
    <>
      <Header
        title="Copiloto Académico"
        subtitle="Pregunta sobre tus recursos de estudio"
      />

      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Subject Selector */}
        <div className="p-4 border-b bg-white">
          <div className="max-w-3xl mx-auto">
            <Select
              options={subjectOptions}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-64"
              disabled={isLoadingSubjects}
            />
            {selectedSubjectId && (
              <p className="text-sm text-secondary-500 mt-2">
                Las respuestas se basarán en los recursos indexados de esta materia.
              </p>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen
                onSelectQuestion={(q) => setInput(q)}
                exampleQuestions={exampleQuestions}
              />
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-3 text-secondary-500">
                <Spinner size="sm" />
                <span>Buscando en tus recursos...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                placeholder="Pregunta sobre tus materiales de estudio..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pr-12 min-h-[60px] max-h-[200px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 bottom-2"
                disabled={!input.trim() || isLoading}
                leftIcon={<Send className="h-4 w-4" />}
              >
                Enviar
              </Button>
            </div>
            <p className="text-xs text-secondary-400 mt-2 text-center">
              Las respuestas se generan a partir de tus recursos indexados.
              Siempre verifica la información con las fuentes originales.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

function WelcomeScreen({
  onSelectQuestion,
  exampleQuestions,
}: {
  onSelectQuestion: (q: string) => void;
  exampleQuestions: string[];
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Sparkles className="h-8 w-8 text-primary-600" />
      </div>
      <h2 className="text-2xl font-bold text-secondary-900 mb-2">
        Copiloto Académico
      </h2>
      <p className="text-secondary-500 max-w-md mx-auto mb-8">
        Pregúntame sobre tus materiales de estudio. Puedo ayudarte a entender
        conceptos, crear resúmenes y preparar exámenes.
      </p>

      <div className="grid gap-2 max-w-md mx-auto">
        <p className="text-sm font-medium text-secondary-700 mb-2">
          Prueba preguntar:
        </p>
        {exampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelectQuestion(q)}
            className="text-left p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm text-secondary-700"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary-600 text-white rounded-2xl rounded-br-md px-4 py-3">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <Card padding="none" className="overflow-hidden">
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-secondary-800">
                  {message.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-secondary-100">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiar
                    </>
                  )}
                </button>

                {message.citations && message.citations.length > 0 && (
                  <button
                    onClick={() => setShowCitations(!showCitations)}
                    className="flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-700"
                  >
                    <BookOpen className="h-3 w-3" />
                    {message.citations.length} fuente
                    {message.citations.length !== 1 && 's'}
                    {showCitations ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}

                {message.processingTimeMs && (
                  <span className="text-xs text-secondary-400 ml-auto">
                    {(message.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Citations */}
              {showCitations && message.citations && (
                <div className="mt-3 pt-3 border-t border-secondary-100 space-y-2">
                  {message.citations.map((citation, i) => (
                    <div
                      key={i}
                      className="p-3 bg-secondary-50 rounded-lg text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-secondary-900">
                            {citation.resourceTitle}
                          </p>
                          <p className="text-secondary-600 text-xs mt-1 line-clamp-2">
                            "{citation.chunkContent}"
                          </p>
                        </div>
                        <Badge
                          variant="primary"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {Math.round(citation.relevanceScore * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
