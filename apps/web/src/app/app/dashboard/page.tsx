'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  Layers,
  ClipboardCheck,
  MessageSquare,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count: {
    resources: number;
    flashcards: number;
    quizzes: number;
  };
}

interface DashboardStats {
  totalSubjects: number;
  totalResources: number;
  totalFlashcards: number;
  totalQuizzes: number;
  studyStreak: number;
  weeklyProgress: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  type: 'exam' | 'assignment' | 'study';
  date: string;
  subjectName?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const subjectsResponse = await fetch('/api/v1/subjects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const subjectsData = await subjectsResponse.json();

        const calculatedStats: DashboardStats = {
          totalSubjects: subjectsData.length || 0,
          totalResources: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.resources, 0),
          totalFlashcards: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.flashcards, 0),
          totalQuizzes: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.quizzes, 0),
          studyStreak: 5,
          weeklyProgress: 72,
        };

        // Fetch upcoming events from calendar
        try {
          const eventsResponse = await fetch('/api/v1/calendar/events/week', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            setUpcomingEvents(eventsData.slice(0, 3));
          }
        } catch {
          // Calendar events are optional
        }

        setSubjects(subjectsData);
        setStats(calculatedStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-secondary-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-secondary-900">
            {getGreeting()}, {user.profile?.firstName}
          </h1>
          <p className="text-secondary-500 mt-1">
            Aquí tienes un resumen de tu actividad
          </p>
        </div>

        {/* Quick Stats Pills */}
        {stats && stats.studyStreak > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
              <Target className="h-4 w-4" />
              <span>{stats.studyStreak} días de racha</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>{stats.weeklyProgress}% esta semana</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalSubjects}</p>
                  <p className="text-sm text-secondary-500">Materias activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 rounded-xl">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">0</p>
                  <p className="text-sm text-secondary-500">Consultas al copiloto</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalResources}</p>
                  <p className="text-sm text-secondary-500">Recursos guardados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 rounded-xl">
                  <Layers className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalFlashcards}</p>
                  <p className="text-sm text-secondary-500">Flashcards creadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subjects Section - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Tus materias</h2>
            <Link href="/app/subjects" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {subjects.length === 0 ? (
            <Card className="border-dashed border-2 border-secondary-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="p-3 bg-secondary-100 rounded-full mb-4">
                  <BookOpen className="h-6 w-6 text-secondary-400" />
                </div>
                <h3 className="text-base font-medium text-secondary-900 mb-1">
                  No tienes materias aún
                </h3>
                <p className="text-secondary-500 text-sm mb-4 text-center max-w-xs">
                  Comienza agregando tu primera materia para organizar tus estudios
                </p>
                <Link href="/app/subjects/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear materia
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {subjects.slice(0, 4).map((subject) => (
                <Link key={subject.id} href={`/app/subjects/${subject.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                          style={{ backgroundColor: subject.color || '#6366f1' }}
                        >
                          {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-secondary-500 mt-0.5">
                            {subject._count.resources} recursos
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-secondary-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Quick Actions & Events */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-500" />
                Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/app/copilot" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 font-normal hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200">
                  <MessageSquare className="h-4 w-4" />
                  Preguntar al copiloto
                </Button>
              </Link>
              <Link href="/app/search" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 font-normal hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200">
                  <Search className="h-4 w-4" />
                  Buscar recursos académicos
                </Button>
              </Link>
              <Link href="/app/subjects/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 font-normal hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200">
                  <Plus className="h-4 w-4" />
                  Crear nueva materia
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
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
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-secondary-300 mx-auto mb-2" />
                  <p className="text-sm text-secondary-500">No hay eventos próximos</p>
                  <Link href="/app/calendar">
                    <Button variant="link" size="sm" className="mt-2">
                      Agregar evento
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors">
                      <div className={`p-1.5 rounded-lg ${
                        event.type === 'exam' ? 'bg-red-100 text-red-600' :
                        event.type === 'assignment' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {event.type === 'exam' ? <ClipboardCheck className="h-4 w-4" /> :
                         event.type === 'assignment' ? <FileText className="h-4 w-4" /> :
                         <BookOpen className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 truncate">{event.title}</p>
                        <p className="text-xs text-secondary-500">
                          {new Date(event.date).toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
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