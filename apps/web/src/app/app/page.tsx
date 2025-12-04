'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { subjects as subjectsApi, rag, Subject, RagStats } from '@/lib/api';
import {
  BookOpen,
  Plus,
  MessageSquare,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatRelativeTime, getContrastColor } from '@/lib/utils';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<RagStats | null>(null);
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
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Header
        title={`Hola, ${user?.profile?.firstName || 'estudiante'}`}
        subtitle="Aquí tienes un resumen de tu actividad"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {subjects.length}
                </p>
                <p className="text-sm text-secondary-500">Materias activas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {stats?.totalQueries || 0}
                </p>
                <p className="text-sm text-secondary-500">Consultas al copiloto</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary-900">
                  {subjects.reduce((acc, s) => acc + (s._count?.resources || 0), 0)}
                </p>
                <p className="text-sm text-secondary-500">Recursos guardados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subjects List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle>Tus materias</CardTitle>
                <Link href="/app/subjects">
                  <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Ver todas
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {subjects.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-8 w-8" />}
                    title="No tienes materias aún"
                    description="Crea tu primera materia para empezar a organizar tus recursos y usar el copiloto"
                    action={
                      <Link href="/app/subjects">
                        <Button leftIcon={<Plus className="h-4 w-4" />}>
                          Crear materia
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="grid gap-3">
                    {subjects.slice(0, 4).map((subject) => (
                      <Link
                        key={subject.id}
                        href={`/app/subjects/${subject.id}`}
                        className="flex items-center gap-4 p-4 rounded-lg border border-secondary-200 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{
                            backgroundColor: subject.color,
                            color: getContrastColor(subject.color),
                          }}
                        >
                          {subject.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-secondary-900 truncate">
                            {subject.name}
                          </h3>
                          <p className="text-sm text-secondary-500">
                            {subject._count?.resources || 0} recursos
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-secondary-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity / Quick Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="p-6 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  Acciones rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-2">
                <Link href="/app/copilot" className="block">
                  <Button variant="outline" className="w-full justify-start" leftIcon={<MessageSquare className="h-4 w-4" />}>
                    Preguntar al copiloto
                  </Button>
                </Link>
                <Link href="/app/search" className="block">
                  <Button variant="outline" className="w-full justify-start" leftIcon={<BookOpen className="h-4 w-4" />}>
                    Buscar recursos académicos
                  </Button>
                </Link>
                <Link href="/app/subjects" className="block">
                  <Button variant="outline" className="w-full justify-start" leftIcon={<Plus className="h-4 w-4" />}>
                    Crear nueva materia
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Queries */}
            {stats && stats.recentQueries.length > 0 && (
              <Card>
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-secondary-400" />
                    Consultas recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-3">
                    {stats.recentQueries.slice(0, 5).map((query) => (
                      <div key={query.id} className="text-sm">
                        <p className="text-secondary-900 line-clamp-2">
                          {query.query}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
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
          </div>
        </div>
      </div>
    </>
  );
}
