'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
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
  Bot,
  Zap,
  Brain,
  Lightbulb,
  GraduationCap,
  FileText,
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
    { icon: Lightbulb, text: '¿Cuáles son los conceptos clave de este tema?' },
    { icon: Brain, text: 'Explícame esto con un ejemplo práctico' },
    { icon: FileText, text: 'Resúmeme las ideas principales' },
    { icon: GraduationCap, text: '¿Cuáles son los errores más comunes en exámenes?' },
    { icon: BookOpen, text: 'Dame una lista de definiciones importantes' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-primary-50/80 via-white to-violet-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                <Zap className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                Copiloto <span className="gradient-text">Académico</span>
              </h1>
              <p className="text-secondary-500 mt-0.5">
                Tu asistente de IA para estudiar de forma más inteligente
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-gradient-to-b from-secondary-50/50 to-white">
        {/* Subject Selector */}
        <div className="p-4 border-b border-secondary-200/50 bg-white/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Select
                  options={subjectOptions}
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full max-w-xs"
                  disabled={isLoadingSubjects}
                />
              </div>
              {selectedSubjectId && (
                <Badge variant="primary" className="animate-fade-in">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Contexto activo
                </Badge>
              )}
            </div>
            {selectedSubjectId && (
              <p className="text-sm text-secondary-500 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Las respuestas se basarán en los recursos indexados de esta materia.
              </p>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen
                onSelectQuestion={(q) => setInput(q)}
                exampleQuestions={exampleQuestions}
              />
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <MessageBubble message={message} />
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-secondary-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-secondary-500 text-sm">Buscando en tus recursos...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Premium Input Area */}
        <div className="p-4 border-t border-secondary-200/50 bg-white/90 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="relative rounded-2xl border-2 border-secondary-200 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-200 bg-white overflow-hidden">
                <Textarea
                  placeholder="Pregunta sobre tus materiales de estudio..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="border-0 pr-24 min-h-[60px] max-h-[200px] resize-none focus:ring-0 bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <span className="text-xs text-secondary-400 hidden sm:block">
                    Shift + Enter para nueva línea
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    variant="gradient"
                    disabled={!input.trim() || isLoading}
                    className="shadow-lg shadow-primary-500/25"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-secondary-400 mt-3 text-center">
              Las respuestas se generan a partir de tus recursos indexados.
              <span className="text-secondary-500"> Siempre verifica la información con las fuentes originales.</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onSelectQuestion,
  exampleQuestions,
}: {
  onSelectQuestion: (q: string) => void;
  exampleQuestions: Array<{ icon: any; text: string }>;
}) {
  return (
    <div className="text-center py-12 animate-fade-in">
      {/* Animated Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/20 to-violet-500/20 rounded-full blur-2xl animate-pulse" />

        {/* Floating badges */}
        <div className="absolute -top-2 -right-8 px-3 py-1.5 bg-white rounded-full shadow-lg border border-secondary-100 animate-float" style={{ animationDelay: '0.5s' }}>
          <span className="text-xs font-medium text-secondary-600 flex items-center gap-1">
            <Brain className="h-3 w-3 text-primary-500" /> IA
          </span>
        </div>
        <div className="absolute -bottom-2 -left-8 px-3 py-1.5 bg-white rounded-full shadow-lg border border-secondary-100 animate-float" style={{ animationDelay: '1s' }}>
          <span className="text-xs font-medium text-secondary-600 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" /> Rápido
          </span>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-secondary-900 mb-3">
        Copiloto <span className="gradient-text">Académico</span>
      </h2>
      <p className="text-secondary-500 max-w-md mx-auto mb-10 text-lg">
        Pregúntame sobre tus materiales de estudio. Puedo ayudarte a entender
        conceptos, crear resúmenes y preparar exámenes.
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-10">
        {[
          { icon: BookOpen, label: 'Basado en tus recursos', color: 'from-blue-500 to-cyan-500' },
          { icon: Brain, label: 'Contexto inteligente', color: 'from-violet-500 to-purple-500' },
          { icon: Zap, label: 'Respuestas rápidas', color: 'from-amber-500 to-orange-500' },
        ].map((feature, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white border border-secondary-100 shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            <div className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br mx-auto mb-2',
              feature.color,
              'flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform'
            )}>
              <feature.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-xs font-medium text-secondary-600">{feature.label}</p>
          </div>
        ))}
      </div>

      {/* Example questions */}
      <div className="space-y-2 max-w-lg mx-auto">
        <p className="text-sm font-semibold text-secondary-700 mb-4 flex items-center justify-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Prueba preguntar:
        </p>
        {exampleQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelectQuestion(q.text)}
            className={cn(
              'w-full text-left p-4 rounded-xl',
              'bg-white border border-secondary-200',
              'hover:border-primary-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-violet-50',
              'transition-all duration-200 text-sm text-secondary-700',
              'flex items-center gap-3 group'
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="w-8 h-8 rounded-lg bg-secondary-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
              <q.icon className="h-4 w-4 text-secondary-500 group-hover:text-primary-600 transition-colors" />
            </div>
            <span className="flex-1">{q.text}</span>
            <Send className="h-4 w-4 text-secondary-300 group-hover:text-primary-500 transition-colors" />
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
        <div className="max-w-[80%] bg-gradient-to-br from-primary-500 to-violet-500 text-white rounded-2xl rounded-br-md px-5 py-3 shadow-lg shadow-primary-500/20">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl rounded-tl-md shadow-sm border border-secondary-100 overflow-hidden">
            <div className="p-5">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-secondary-800 leading-relaxed">
                  {message.content}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-secondary-100">
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    copied
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </>
                  )}
                </button>

                {message.citations && message.citations.length > 0 && (
                  <button
                    onClick={() => setShowCitations(!showCitations)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                      showCitations
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
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
                  <span className="text-xs text-secondary-400 ml-auto flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {(message.processingTimeMs / 1000).toFixed(1)}s
                  </span>
                )}
              </div>

              {/* Citations */}
              {showCitations && message.citations && (
                <div className="mt-4 pt-4 border-t border-secondary-100 space-y-2 animate-fade-in">
                  {message.citations.map((citation, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gradient-to-r from-secondary-50 to-primary-50/30 rounded-xl text-sm border border-secondary-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-secondary-900 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary-500" />
                            {citation.resourceTitle}
                          </p>
                          <p className="text-secondary-600 text-xs mt-2 line-clamp-2 italic">
                            "{citation.chunkContent}"
                          </p>
                        </div>
                        <Badge
                          variant="gradient"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
