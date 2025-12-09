'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { studyPlans, StudyPlan, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Sparkles,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  Circle,
  Trash2,
  RefreshCw,
  Loader2,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudyPlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    subjectId: '',
    topic: '',
    targetDate: '',
    dailyHours: 2,
    learningStyle: 'VISUAL' as 'VISUAL' | 'AUDITORY' | 'READING' | 'KINESTHETIC',
    difficulty: 'INTERMEDIATE' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  });

  // Load plans
  const loadPlans = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await studyPlans.list(token);
      setPlans(data);
    } catch (error) {
      console.error('Error loading study plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // Generate plan
  const handleGenerate = async () => {
    if (!token || !createForm.subjectId || !createForm.topic) return;
    setIsGenerating(true);
    try {
      const plan = await studyPlans.generate(token, createForm);
      setPlans(prev => [plan, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        subjectId: '',
        topic: '',
        targetDate: '',
        dailyHours: 2,
        learningStyle: 'VISUAL',
        difficulty: 'INTERMEDIATE',
      });
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update activity status
  const handleActivityToggle = async (planId: string, activityId: string, completed: boolean) => {
    if (!token) return;
    try {
      const updated = await studyPlans.updateActivity(token, planId, activityId, { completed });
      setPlans(prev => prev.map(p => p.id === planId ? updated : p));
      if (selectedPlan?.id === planId) setSelectedPlan(updated);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  // Regenerate plan
  const handleRegenerate = async (id: string) => {
    if (!token) return;
    try {
      const updated = await studyPlans.regenerate(token, id);
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
      if (selectedPlan?.id === id) setSelectedPlan(updated);
    } catch (error) {
      console.error('Error regenerating plan:', error);
    }
  };

  // Delete plan
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await studyPlans.delete(token, id);
      setPlans(prev => prev.filter(p => p.id !== id));
      if (selectedPlan?.id === id) setSelectedPlan(null);
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  // Calculate progress
  const getProgress = (plan: StudyPlan) => {
    if (!plan.activities || plan.activities.length === 0) return 0;
    const completed = plan.activities.filter(a => a.completed).length;
    return Math.round((completed / plan.activities.length) * 100);
  };

  const getStatusBadge = (status: StudyPlan['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success"><Play className="h-3 w-3 mr-1" />Activo</Badge>;
      case 'COMPLETED':
        return <Badge variant="primary"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'PAUSED':
        return <Badge variant="warning"><Pause className="h-3 w-3 mr-1" />Pausado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLearningStyleLabel = (style: string) => {
    const styles: Record<string, string> = {
      VISUAL: 'Visual',
      AUDITORY: 'Auditivo',
      READING: 'Lectura/Escritura',
      KINESTHETIC: 'Kinestésico',
    };
    return styles[style] || style;
  };

  // Detail view
  if (selectedPlan) {
    const progress = getProgress(selectedPlan);

    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedPlan(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedPlan.topic}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedPlan.status)}
                    <Badge variant="secondary">{getLearningStyleLabel(selectedPlan.learningStyle)}</Badge>
                    <span className="text-sm text-secondary-500">
                      {selectedPlan.dailyHours}h/día
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleRegenerate(selectedPlan.id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
                <Button variant="outline" onClick={() => handleDelete(selectedPlan.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-700">Progreso General</span>
                <span className="text-sm font-bold text-violet-600">{progress}%</span>
              </div>
              <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Plan Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Fecha Meta</p>
                      <p className="font-semibold text-secondary-900">
                        {selectedPlan.targetDate
                          ? new Date(selectedPlan.targetDate).toLocaleDateString()
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Horas Diarias</p>
                      <p className="font-semibold text-secondary-900">{selectedPlan.dailyHours} horas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-fuchsia-100 flex items-center justify-center">
                      <Target className="h-5 w-5 text-fuchsia-600" />
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">Dificultad</p>
                      <p className="font-semibold text-secondary-900">{selectedPlan.difficulty}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activities */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-violet-500" />
                  Actividades del Plan
                </h3>
                <div className="space-y-3">
                  {selectedPlan.activities && selectedPlan.activities.length > 0 ? (
                    selectedPlan.activities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "flex items-start gap-3 p-4 rounded-xl border transition-all",
                          activity.completed
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-white border-secondary-200 hover:border-violet-300"
                        )}
                      >
                        <button
                          onClick={() => handleActivityToggle(selectedPlan.id, activity.id, !activity.completed)}
                          className="mt-0.5"
                        >
                          {activity.completed ? (
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Circle className="h-6 w-6 text-secondary-300 hover:text-violet-500" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-violet-600">Día {activity.day}</span>
                            {activity.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.duration} min
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "font-medium mt-1",
                            activity.completed ? "text-secondary-500 line-through" : "text-secondary-900"
                          )}>
                            {activity.title}
                          </p>
                          {activity.description && (
                            <p className="text-sm text-secondary-500 mt-1">{activity.description}</p>
                          )}
                          {activity.resources && activity.resources.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {activity.resources.map((resource, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {resource}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-secondary-500 text-center py-4">
                      No hay actividades definidas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500">
                    Planes de Estudio
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Genera planes personalizados con IA
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generar Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : plans.length === 0 ? (
            <EmptyState
              icon={<Brain className="h-8 w-8" />}
              title="Sin planes de estudio"
              description="Genera tu primer plan de estudio personalizado con IA"
              action={
                <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Plan
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(plan => {
                const progress = getProgress(plan);
                return (
                  <Card
                    key={plan.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-500" />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        {getStatusBadge(plan.status)}
                      </div>
                      <h3 className="font-semibold text-secondary-900 mb-1">{plan.topic}</h3>
                      <p className="text-sm text-secondary-500 mb-3">
                        {plan.dailyHours}h/día • {getLearningStyleLabel(plan.learningStyle)}
                      </p>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary-500">Progreso</span>
                          <span className="text-xs font-medium text-violet-600">{progress}%</span>
                        </div>
                        <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                        <span className="text-xs text-secondary-400">
                          {plan.activities?.length || 0} actividades
                        </span>
                        <ChevronRight className="h-4 w-4 text-secondary-400 group-hover:text-violet-500 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generar Plan de Estudio"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <span className="font-medium text-violet-700">Plan con IA</span>
            </div>
            <p className="text-sm text-violet-600">
              La IA creará un plan personalizado basado en tu estilo de aprendizaje y disponibilidad.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Materia *
            </label>
            <Select
              value={createForm.subjectId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Seleccionar materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Tema a estudiar *
            </label>
            <Input
              placeholder="Ej: Cálculo diferencial, Historia de México..."
              value={createForm.topic}
              onChange={(e) => setCreateForm(prev => ({ ...prev, topic: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Fecha meta
              </label>
              <Input
                type="date"
                value={createForm.targetDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Horas diarias
              </label>
              <Input
                type="number"
                min={1}
                max={8}
                value={createForm.dailyHours}
                onChange={(e) => setCreateForm(prev => ({ ...prev, dailyHours: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Estilo de aprendizaje
              </label>
              <Select
                value={createForm.learningStyle}
                onChange={(e) => setCreateForm(prev => ({ ...prev, learningStyle: e.target.value as typeof createForm.learningStyle }))}
                options={[
                  { value: 'VISUAL', label: 'Visual' },
                  { value: 'AUDITORY', label: 'Auditivo' },
                  { value: 'READING', label: 'Lectura/Escritura' },
                  { value: 'KINESTHETIC', label: 'Kinestésico' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Dificultad
              </label>
              <Select
                value={createForm.difficulty}
                onChange={(e) => setCreateForm(prev => ({ ...prev, difficulty: e.target.value as typeof createForm.difficulty }))}
                options={[
                  { value: 'BEGINNER', label: 'Principiante' },
                  { value: 'INTERMEDIATE', label: 'Intermedio' },
                  { value: 'ADVANCED', label: 'Avanzado' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleGenerate}
              disabled={!createForm.subjectId || !createForm.topic || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Plan
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
