'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  analytics,
  DashboardStats,
  StudyTimeData,
  SubjectDistribution,
  FlashcardAnalytics,
  QuizAnalytics,
  ProgressPrediction,
} from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
} from '@/components/ui';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Brain,
  Target,
  Zap,
  Award,
  Calendar,
  BookOpen,
  Loader2,
  Star,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'flashcards' | 'quizzes' | 'predictions';

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  // Data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [studyTimeData, setStudyTimeData] = useState<StudyTimeData[]>([]);
  const [subjectDistribution, setSubjectDistribution] = useState<SubjectDistribution[]>([]);
  const [flashcardStats, setFlashcardStats] = useState<FlashcardAnalytics | null>(null);
  const [quizStats, setQuizStats] = useState<QuizAnalytics | null>(null);
  const [prediction, setPrediction] = useState<ProgressPrediction | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [dashboard, studyTime, subjects, flashcards, quizzes, pred] = await Promise.all([
        analytics.getDashboard(token),
        analytics.getStudyTimeChart(token, timeRange),
        analytics.getSubjectDistribution(token),
        analytics.getFlashcardStats(token),
        analytics.getQuizStats(token),
        analytics.getProgressPrediction(token),
      ]);
      setDashboardStats(dashboard);
      setStudyTimeData(studyTime);
      setSubjectDistribution(subjects);
      setFlashcardStats(flashcards);
      setQuizStats(quizzes);
      setPrediction(pred);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    Analíticas
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Tu progreso en detalle</p>
              </div>
            </div>
            <Select
              value={timeRange.toString()}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              options={[
                { value: '7', label: 'Últimos 7 días' },
                { value: '30', label: 'Últimos 30 días' },
                { value: '90', label: 'Últimos 3 meses' },
              ]}
              className="w-48"
            />
          </div>

          {/* Quick Stats */}
          {dashboardStats && (
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-indigo-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Tiempo total</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{formatMinutes(dashboardStats.totalStudyTime)}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Brain className="h-4 w-4" />
                  <span className="text-sm font-medium">Flashcards</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{dashboardStats.flashcardsReviewed}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Quizzes</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{dashboardStats.quizzesTaken}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Racha</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{dashboardStats.currentStreak} días</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-pink-600 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-sm font-medium">Nivel</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{dashboardStats.level}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'General', icon: BarChart3 },
              { id: 'flashcards', label: 'Flashcards', icon: Brain },
              { id: 'quizzes', label: 'Quizzes', icon: Target },
              { id: 'predictions', label: 'Predicciones', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-indigo-600"
                    : "text-secondary-600 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Study Time Chart */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Tiempo de estudio</h3>
                  <div className="h-64 flex items-end gap-1">
                    {studyTimeData.map((day, idx) => {
                      const maxMinutes = Math.max(...studyTimeData.map(d => d.minutes), 60);
                      const height = (day.minutes / maxMinutes) * 100;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group">
                          <div className="w-full bg-secondary-100 rounded-t relative h-48">
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all group-hover:from-indigo-600 group-hover:to-purple-600"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <p className="text-xs text-secondary-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {day.minutes}m
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-secondary-500 mt-2">
                    <span>{studyTimeData[0]?.date}</span>
                    <span>{studyTimeData[studyTimeData.length - 1]?.date}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Subject Distribution */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Distribución por materia</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Pie Chart Representation */}
                    <div className="relative h-64">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {subjectDistribution.reduce((acc, subject, idx) => {
                          const startAngle = acc.angle;
                          const angle = (subject.percentage / 100) * 360;
                          const endAngle = startAngle + angle;

                          const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                          const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                          const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                          const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);

                          const largeArc = angle > 180 ? 1 : 0;

                          acc.elements.push(
                            <path
                              key={idx}
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={subject.color || `hsl(${idx * 60}, 70%, 60%)`}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          );

                          return { elements: acc.elements, angle: endAngle };
                        }, { elements: [] as JSX.Element[], angle: 0 }).elements}
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3">
                      {subjectDistribution.map((subject, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: subject.color || `hsl(${idx * 60}, 70%, 60%)` }}
                            />
                            <span className="text-secondary-700">{subject.subjectName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-secondary-900">{subject.percentage}%</span>
                            <span className="text-sm text-secondary-500 ml-2">({formatMinutes(subject.minutes)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Flashcards Tab */}
          {activeTab === 'flashcards' && flashcardStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-bold text-secondary-900">{flashcardStats.masteredCards}</p>
                    <p className="text-secondary-500">Dominadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-3xl font-bold text-secondary-900">{flashcardStats.learningCards}</p>
                    <p className="text-secondary-500">Aprendiendo</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-secondary-900">{flashcardStats.newCards}</p>
                    <p className="text-secondary-500">Nuevas</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Progreso de retención</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${flashcardStats.averageRetention}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-secondary-900">{flashcardStats.averageRetention}%</span>
                  </div>
                  <p className="text-secondary-500 mt-2">
                    Tienes {flashcardStats.reviewsDue} tarjetas pendientes de revisión
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quizzes Tab */}
          {activeTab === 'quizzes' && quizStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Target className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{quizStats.totalQuizzes}</p>
                    <p className="text-sm text-secondary-500">Quizzes totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{quizStats.averageScore}%</p>
                    <p className="text-sm text-secondary-500">Promedio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{quizStats.bestScore}%</p>
                    <p className="text-sm text-secondary-500">Mejor puntaje</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">
                      {quizStats.correctAnswers}/{quizStats.totalQuestions}
                    </p>
                    <p className="text-sm text-secondary-500">Correctas</p>
                  </CardContent>
                </Card>
              </div>

              {/* By Subject */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Por materia</h3>
                  <div className="space-y-4">
                    {quizStats.bySubject.map((subject, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-32 text-secondary-700 truncate">{subject.subjectName}</div>
                        <div className="flex-1">
                          <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                subject.averageScore >= 80 ? "bg-emerald-500" :
                                subject.averageScore >= 60 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${subject.averageScore}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-medium text-secondary-900 w-16 text-right">{subject.averageScore}%</span>
                        <span className="text-sm text-secondary-500 w-20">({subject.count} quizzes)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && prediction && (
            <div className="space-y-6">
              <Card className="overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-2">Predicción de progreso</h3>
                      <p className="text-secondary-600">
                        Basado en tu ritmo actual, estimamos que alcanzarás tus objetivos
                      </p>
                    </div>
                    <Badge variant={prediction.confidence >= 80 ? 'success' : 'warning'}>
                      {prediction.confidence}% confianza
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-6">
                    <div className="text-center p-4 bg-secondary-50 rounded-xl">
                      <p className="text-sm text-secondary-500 mb-1">Progreso actual</p>
                      <p className="text-3xl font-bold text-secondary-900">{prediction.currentProgress}%</p>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-xl">
                      <p className="text-sm text-indigo-600 mb-1">Predicción</p>
                      <p className="text-3xl font-bold text-indigo-600">{prediction.predictedProgress}%</p>
                      {prediction.predictedProgress > prediction.currentProgress ? (
                        <ArrowUp className="h-4 w-4 text-emerald-500 mx-auto mt-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-500 mx-auto mt-1" />
                      )}
                    </div>
                    <div className="text-center p-4 bg-secondary-50 rounded-xl">
                      <p className="text-sm text-secondary-500 mb-1">Fecha estimada</p>
                      <p className="text-xl font-bold text-secondary-900">
                        {new Date(prediction.estimatedCompletionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Recomendaciones</h3>
                  <div className="space-y-3">
                    {prediction.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-secondary-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                          {idx + 1}
                        </div>
                        <p className="text-secondary-700">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
