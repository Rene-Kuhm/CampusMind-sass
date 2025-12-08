'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../lib/auth-context';
import Link from 'next/link';

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
  recentActivity: Array<{
    type: 'resource' | 'flashcard' | 'quiz';
    title: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch subjects
        const subjectsResponse = await fetch('/api/v1/subjects', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const subjectsData = await subjectsResponse.json();
        
        // Mock stats for now
        const mockStats: DashboardStats = {
          totalSubjects: subjectsData.length || 0,
          totalResources: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.resources, 0),
          totalFlashcards: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.flashcards, 0),
          totalQuizzes: subjectsData.reduce((acc: number, subject: Subject) => acc + subject._count.quizzes, 0),
          recentActivity: [
            {
              type: 'resource',
              title: 'Apuntes de Álgebra Lineal',
              timestamp: '2024-12-07T10:30:00Z',
            },
            {
              type: 'flashcard',
              title: 'Flashcards de Cálculo',
              timestamp: '2024-12-07T09:15:00Z',
            },
          ],
        };

        setSubjects(subjectsData);
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Acceso Requerido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              Por favor inicia sesión para ver tu dashboard
            </p>
            <Link href="/auth/login">
              <Button className="w-full">
                Iniciar Sesión
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CampusMind</h1>
              <span className="ml-2 text-sm text-gray-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.profile?.firstName} {user.profile?.lastName}
              </span>
              <Link href="/app/settings">
                <Button variant="outline" size="sm">
                  Configuración
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            ¡Bienvenido, {user.profile?.firstName}! 👋
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Tu espacio de estudio inteligente está listo para ayudarte a alcanzar tus metas académicas.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Materias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSubjects}</div>
                <p className="text-xs text-muted-foreground">Activas este semestre</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalResources}</div>
                <p className="text-xs text-muted-foreground">Apuntes y materiales</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFlashcards}</div>
                <p className="text-xs text-muted-foreground">Para repasar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">Evaluaciones realizadas</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Tus Materias</h3>
            <Link href="/app/subjects">
              <Button variant="outline">Ver Todas</Button>
            </Link>
          </div>

          {subjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes materias aún
                </h3>
                <p className="text-gray-500 mb-4 text-center">
                  Comienza agregando tu primera materia para organizar tus estudios
                </p>
                <Link href="/app/subjects/new">
                  <Button>Crear Primera Materia</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Link key={subject.id} href={`/app/subjects/${subject.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: subject.color || '#6366f1' }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {subject.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{subject._count.resources} recursos</span>
                        <span>{subject._count.flashcards} flashcards</span>
                        <span>{subject._count.quizzes} quizzes</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {stats?.recentActivity && stats.recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Badge variant={
                      activity.type === 'resource' ? 'default' :
                      activity.type === 'flashcard' ? 'secondary' : 'default'
                    }>
                      {activity.type === 'resource' && '📄'}
                      {activity.type === 'flashcard' && '🃏'}
                      {activity.type === 'quiz' && '📝'}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold mb-2">Copiloto IA</h3>
              <p className="text-gray-600 text-center mb-4">
                Consulta sobre cualquier tema con IA
              </p>
              <Link href="/app/copilot">
                <Button className="w-full">Consultar</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">Buscar Recursos</h3>
              <p className="text-gray-600 text-center mb-4">
                Encuentra materiales de estudio
              </p>
              <Link href="/app/search">
                <Button className="w-full" variant="outline">Buscar</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-semibold mb-2">Calendario</h3>
              <p className="text-gray-600 text-center mb-4">
                Planifica tus sesiones de estudio
              </p>
              <Link href="/app/calendar">
                <Button className="w-full" variant="outline">Ver Calendario</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}