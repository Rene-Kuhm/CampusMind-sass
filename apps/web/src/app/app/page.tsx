'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
} from '@/components/ui';
import { subjects as subjectsApi, rag, calendar, Subject, RagStats } from '@/lib/api';
import {
  BookOpen,
  Plus,
  MessageSquare,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Target,
  Calendar,
  Layers,
  FileText,
  ClipboardCheck,
  Zap,
  GraduationCap,
  Brain,
  Award,
  ChevronRight,
  Play,
  Star,
} from 'lucide-react';
import { formatRelativeTime, getContrastColor } from '@/lib/utils';

interface UpcomingEvent {
  id: string;
  title: string;
  type: string;
  startDate: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<RagStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!token) return;

      try {
        const [subjectsData, statsData] = await Promise.all([
          subjectsApi.list(token),
          rag.getStats(token).catch(() => null),
        ]);
        setSubjects(subjectsData);
        setStats(statsData);

        try {
          const events = await calendar.getWeekEvents(token);
          setUpcomingEvents(events.slice(0, 3));
        } catch {
          // Calendar events are optional
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full gradient-primary animate-pulse-glow mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-white animate-bounce-subtle" />
            </div>
          </div>
          <p className="text-secondary-500 animate-pulse">Cargando tu espacio de estudio...</p>
        </div>
      </div>
    );
  }

  const totalResources = subjects.reduce((acc, s) => acc + (s._count?.resources || 0), 0);
  const totalFlashcards = subjects.reduce((acc, s) => acc + (s._count?.flashcards || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float animation-delay-300" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-500/5 to-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl gradient-primary shadow-lg shadow-primary-500/25">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <Badge variant="premium" size="lg" dot pulse>
                  Campus Virtual
                </Badge>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-secondary-900 tracking-tight">
                {getGreeting()},{' '}
                <span className="gradient-text">{user?.profile?.firstName || 'estudiante'}</span>
              </h1>
              <p className="text-secondary-500 mt-2 text-lg">
                Tu espacio personal de aprendizaje inteligente
              </p>
            </div>

            {/* Achievement Pills */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-in-right animation-delay-200">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 rounded-xl text-sm font-medium border border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="p-1 bg-amber-100 rounded-lg">
                  <Target className="h-4 w-4" />
                </div>
                <span>5 días de racha</span>
                <Zap className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                <div className="p-1 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span>72% esta semana</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Premium Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 stagger-children">
            <StatCard
              icon={<BookOpen className="h-6 w-6" />}
              label="Materias activas"
              value={subjects.length}
              gradient="from-blue-500 to-cyan-500"
              bgGradient="from-blue-50 to-cyan-50"
              delay={0}
            />
            <StatCard
              icon={<MessageSquare className="h-6 w-6" />}
              label="Consultas al copiloto"
              value={stats?.totalQueries || 0}
              gradient="from-emerald-500 to-teal-500"
              bgGradient="from-emerald-50 to-teal-50"
              delay={1}
            />
            <StatCard
              icon={<FileText className="h-6 w-6" />}
              label="Recursos guardados"
              value={totalResources}
              gradient="from-violet-500 to-purple-500"
              bgGradient="from-violet-50 to-purple-50"
              delay={2}
            />
            <StatCard
              icon={<Brain className="h-6 w-6" />}
              label="Flashcards creadas"
              value={totalFlashcards}
              gradient="from-orange-500 to-red-500"
              bgGradient="from-orange-50 to-red-50"
              delay={3}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Subjects Section - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Hero */}
            <Card variant="premium" padding="lg" className="relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 shadow-lg shadow-primary-500/25">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-secondary-900">Copiloto IA</h2>
                    <p className="text-sm text-secondary-500">Tu asistente de estudio inteligente</p>
                  </div>
                </div>
                <p className="text-secondary-600 mb-6 max-w-lg">
                  Pregunta sobre tus materiales, genera resúmenes, crea flashcards y prepara exámenes con ayuda de inteligencia artificial.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/app/copilot">
                    <Button variant="premium" size="lg" leftIcon={<MessageSquare className="h-5 w-5" />} glow>
                      Iniciar conversación
                    </Button>
                  </Link>
                  <Link href="/app/search">
                    <Button variant="outline" size="lg" leftIcon={<Search className="h-5 w-5" />}>
                      Buscar recursos
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Subjects */}
            <div className="animate-fade-in-up animation-delay-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-secondary-100">
                    <Layers className="h-5 w-5 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-secondary-900">Tus materias</h2>
                </div>
                <Link href="/app/subjects" className="group flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Ver todas
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {subjects.length === 0 ? (
                <Card variant="outlined" className="border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary-100 to-secondary-200 flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-secondary-400" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-primary-500 rounded-xl shadow-lg">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      Comienza tu viaje académico
                    </h3>
                    <p className="text-secondary-500 text-center max-w-sm mb-6">
                      Crea tu primera materia para organizar recursos, generar flashcards y estudiar de forma inteligente.
                    </p>
                    <Link href="/app/subjects">
                      <Button variant="premium" leftIcon={<Plus className="h-4 w-4" />} glow>
                        Crear primera materia
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {subjects.slice(0, 4).map((subject, index) => (
                    <SubjectCard key={subject.id} subject={subject} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card variant="premium" className="animate-fade-in-right">
              <CardHeader className="pb-3 px-5 pt-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary-500" />
                  Acciones rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                <QuickActionButton
                  href="/app/copilot"
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="Preguntar al copiloto"
                  description="Consulta con IA"
                />
                <QuickActionButton
                  href="/app/search"
                  icon={<Search className="h-4 w-4" />}
                  label="Buscar recursos"
                  description="Papers y libros"
                />
                <QuickActionButton
                  href="/app/subjects"
                  icon={<Plus className="h-4 w-4" />}
                  label="Nueva materia"
                  description="Organiza tu estudio"
                />
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card variant="premium" className="animate-fade-in-right animation-delay-100">
              <CardHeader className="pb-3 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary-500" />
                    Próximos eventos
                  </CardTitle>
                  <Link href="/app/calendar" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                    Ver todo
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-7 w-7 text-secondary-400" />
                    </div>
                    <p className="text-sm text-secondary-500 mb-3">No hay eventos próximos</p>
                    <Link href="/app/calendar">
                      <Button variant="outline" size="sm">
                        Agregar evento
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Queries */}
            {stats && stats.recentQueries && stats.recentQueries.length > 0 && (
              <Card variant="premium" className="animate-fade-in-right animation-delay-200">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary-400" />
                    Consultas recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-3">
                    {stats.recentQueries.slice(0, 3).map((query) => (
                      <div key={query.id} className="group p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 cursor-pointer">
                        <p className="text-sm text-secondary-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
                          {query.query}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {query.subject && (
                            <Badge variant="default" size="sm">
                              {query.subject.name}
                            </Badge>
                          )}
                          <span className="text-secondary-400 text-xs">
                            {formatRelativeTime(query.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pro Tips */}
            <Card variant="glass" className="animate-fade-in-right animation-delay-300">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-secondary-900 mb-1">Tip del día</h4>
                    <p className="text-xs text-secondary-600 leading-relaxed">
                      Indexa tus PDFs para que el copiloto pueda responder preguntas específicas sobre tu material de estudio.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  gradient,
  bgGradient,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
  bgGradient: string;
  delay: number;
}) {
  return (
    <Card
      variant="premium"
      padding="none"
      hover
      className={`group overflow-hidden animate-fade-in-up`}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <CardContent className={`p-5 bg-gradient-to-br ${bgGradient}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-3xl font-bold text-secondary-900 mb-1 number-counter">{value}</p>
            <p className="text-sm text-secondary-600 font-medium">{label}</p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <div className="text-white">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Subject Card Component
function SubjectCard({ subject, index }: { subject: Subject; index: number }) {
  return (
    <Link href={`/app/subjects/${subject.id}`}>
      <Card
        variant="premium"
        hover
        className="group h-full animate-fade-in-up"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{
                backgroundColor: subject.color,
                color: getContrastColor(subject.color),
                boxShadow: `0 8px 16px -4px ${subject.color}40`,
              }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                {subject.name}
              </h3>
              <p className="text-sm text-secondary-500 mt-1">
                {subject._count?.resources || 0} recursos
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default" size="sm">
                  {subject.career || 'General'}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Quick Action Button Component
function QuickActionButton({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link href={href} className="block">
      <button className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:border-primary-100 hover:bg-gradient-to-r hover:from-primary-50 hover:to-violet-50 transition-all duration-300 group text-left">
        <div className="p-2.5 rounded-xl bg-secondary-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
          <div className="text-secondary-600 group-hover:text-primary-600 transition-colors">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-900 group-hover:text-primary-700 transition-colors">{label}</p>
          <p className="text-xs text-secondary-500">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-secondary-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
      </button>
    </Link>
  );
}

// Event Card Component
function EventCard({ event }: { event: UpcomingEvent }) {
  const eventStyles = {
    EXAM: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <ClipboardCheck className="h-4 w-4" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    ASSIGNMENT: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <FileText className="h-4 w-4" />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    default: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <BookOpen className="h-4 w-4" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  };

  const style = eventStyles[event.type as keyof typeof eventStyles] || eventStyles.default;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${style.bg} border ${style.border} transition-all duration-200 hover:shadow-sm`}>
      <div className={`p-2 rounded-xl ${style.iconBg} ${style.iconColor}`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900 truncate">{event.title}</p>
        <p className="text-xs text-secondary-500 mt-0.5">
          {new Date(event.startDate).toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
    </div>
  );
}
