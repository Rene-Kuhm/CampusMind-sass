'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { goals, StudyGoal, GoalSuggestion, GoalType, GoalUnit, GoalPeriod, GoalStatus, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Target,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Sparkles,
  Play,
  Pause,
  AlertCircle,
  BookOpen,
  Brain,
  Timer,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'active' | 'all' | 'suggestions';

export default function GoalsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [goalsList, setGoalsList] = useState<StudyGoal[]>([]);
  const [activeGoals, setActiveGoals] = useState<StudyGoal[]>([]);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<StudyGoal | null>(null);
  const [progressValue, setProgressValue] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  // Form state
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    type: 'STUDY_HOURS' as GoalType,
    targetValue: '',
    unit: 'HOURS' as GoalUnit,
    subjectId: '',
    periodType: 'WEEKLY' as GoalPeriod,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    reminderEnabled: true,
    reminderTime: '09:00',
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [allGoals, active, suggs] = await Promise.all([
        goals.list(token),
        goals.getActive(token),
        goals.getSuggestions(token).catch(() => []),
      ]);
      setGoalsList(Array.isArray(allGoals) ? allGoals : []);
      setActiveGoals(Array.isArray(active) ? active : []);
      setSuggestions(Array.isArray(suggs) ? suggs : []);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
      loadData();
    }
  }, [token, loadData]);

  // Create goal
  const handleCreate = async () => {
    if (!token || !createForm.title || !createForm.targetValue) return;
    try {
      await goals.create(token, {
        title: createForm.title,
        description: createForm.description || undefined,
        type: createForm.type,
        targetValue: parseInt(createForm.targetValue),
        unit: createForm.unit,
        subjectId: createForm.subjectId || undefined,
        periodType: createForm.periodType,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        reminderEnabled: createForm.reminderEnabled,
        reminderTime: createForm.reminderTime,
      });
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  // Create from suggestion
  const handleCreateFromSuggestion = async (suggestion: GoalSuggestion) => {
    setCreateForm({
      ...createForm,
      title: suggestion.title,
      description: suggestion.description,
      type: suggestion.type,
      targetValue: suggestion.targetValue.toString(),
      unit: suggestion.unit,
      periodType: suggestion.periodType,
    });
    setIsCreateModalOpen(true);
  };

  // Add progress
  const handleAddProgress = async () => {
    if (!token || !selectedGoal || !progressValue) return;
    try {
      await goals.addProgress(token, selectedGoal.id, {
        value: parseInt(progressValue),
        notes: progressNotes || undefined,
      });
      setIsProgressModalOpen(false);
      setSelectedGoal(null);
      setProgressValue('');
      setProgressNotes('');
      loadData();
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  // Update goal status
  const handleUpdateStatus = async (goal: StudyGoal, status: GoalStatus) => {
    if (!token) return;
    try {
      await goals.update(token, goal.id, { status });
      loadData();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  // Delete goal
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await goals.delete(token, id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const resetForm = () => {
    setCreateForm({
      title: '',
      description: '',
      type: 'STUDY_HOURS',
      targetValue: '',
      unit: 'HOURS',
      subjectId: '',
      periodType: 'WEEKLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reminderEnabled: true,
      reminderTime: '09:00',
    });
  };

  const getStatusBadge = (status: GoalStatus) => {
    const config: Record<GoalStatus, { color: string; label: string }> = {
      ACTIVE: { color: 'primary', label: 'Activo' },
      COMPLETED: { color: 'success', label: 'Completado' },
      FAILED: { color: 'error', label: 'No logrado' },
      PAUSED: { color: 'warning', label: 'Pausado' },
      CANCELLED: { color: 'secondary', label: 'Cancelado' },
    };
    const { color, label } = config[status];
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getTypeIcon = (type: GoalType) => {
    const icons: Record<GoalType, typeof Target> = {
      STUDY_HOURS: Clock,
      FLASHCARDS_REVIEW: Brain,
      QUIZZES_COMPLETE: CheckCircle,
      PAGES_READ: FileText,
      POMODOROS: Timer,
      TASKS_COMPLETE: Target,
      CUSTOM: Zap,
    };
    return icons[type] || Target;
  };

  const getTypeLabel = (type: GoalType) => {
    const labels: Record<GoalType, string> = {
      STUDY_HOURS: 'Horas de estudio',
      FLASHCARDS_REVIEW: 'Flashcards',
      QUIZZES_COMPLETE: 'Quizzes',
      PAGES_READ: 'Páginas leídas',
      POMODOROS: 'Pomodoros',
      TASKS_COMPLETE: 'Tareas',
      CUSTOM: 'Personalizado',
    };
    return labels[type];
  };

  const getUnitLabel = (unit: GoalUnit, value: number) => {
    const labels: Record<GoalUnit, string> = {
      HOURS: value === 1 ? 'hora' : 'horas',
      MINUTES: value === 1 ? 'minuto' : 'minutos',
      COUNT: '',
      PAGES: value === 1 ? 'página' : 'páginas',
      PERCENTAGE: '%',
    };
    return labels[unit];
  };

  const getPeriodLabel = (period: GoalPeriod) => {
    const labels: Record<GoalPeriod, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      MONTHLY: 'Mensual',
      SEMESTER: 'Semestral',
      CUSTOM: 'Personalizado',
    };
    return labels[period];
  };

  const calculateProgress = (goal: StudyGoal) => {
    return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Target className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                    Metas de Estudio
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Define y alcanza tus objetivos</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Meta
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">Activas</span>
              </div>
              <p className="text-2xl font-bold text-secondary-900">{activeGoals.length}</p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Completadas</span>
              </div>
              <p className="text-2xl font-bold text-secondary-900">
                {goalsList.filter(g => g.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Promedio</span>
              </div>
              <p className="text-2xl font-bold text-secondary-900">
                {activeGoals.length > 0
                  ? Math.round(activeGoals.reduce((acc, g) => acc + calculateProgress(g), 0) / activeGoals.length)
                  : 0}%
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Sugerencias</span>
              </div>
              <p className="text-2xl font-bold text-secondary-900">{suggestions.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'active', label: 'Activas', icon: Play },
              { id: 'all', label: 'Todas', icon: Target },
              { id: 'suggestions', label: 'Sugerencias', icon: Sparkles },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-emerald-600"
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
          {/* Active Goals */}
          {activeTab === 'active' && (
            activeGoals.length === 0 ? (
              <EmptyState
                icon={<Target className="h-8 w-8" />}
                title="Sin metas activas"
                description="Crea tu primera meta para empezar a trackear tu progreso"
                action={
                  <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Meta
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map(goal => {
                  const progress = calculateProgress(goal);
                  const daysLeft = getDaysRemaining(goal.endDate);
                  const TypeIcon = getTypeIcon(goal.type);

                  return (
                    <Card key={goal.id} className="overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                              <TypeIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-secondary-900">{goal.title}</h3>
                              <p className="text-sm text-secondary-500">{getTypeLabel(goal.type)}</p>
                            </div>
                          </div>
                          {getStatusBadge(goal.status)}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-secondary-600">
                              {goal.currentValue} / {goal.targetValue} {getUnitLabel(goal.unit, goal.targetValue)}
                            </span>
                            <span className={cn(
                              "font-medium",
                              progress >= 100 ? "text-emerald-600" : progress >= 50 ? "text-blue-600" : "text-amber-600"
                            )}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all rounded-full",
                                progress >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                              )}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {getPeriodLabel(goal.periodType)}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1",
                            daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : ""
                          )}>
                            <Clock className="h-4 w-4" />
                            {daysLeft > 0 ? `${daysLeft} días restantes` : 'Vencido'}
                          </span>
                        </div>

                        {goal.subject && (
                          <Badge variant="outline" className="mb-4">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {goal.subject.name}
                          </Badge>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-4 border-t border-secondary-100">
                          <Button
                            variant="gradient"
                            size="sm"
                            className="flex-1"
                            onClick={() => { setSelectedGoal(goal); setIsProgressModalOpen(true); }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Agregar Progreso
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(goal, 'PAUSED')}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* All Goals */}
          {activeTab === 'all' && (
            goalsList.length === 0 ? (
              <EmptyState
                icon={<Target className="h-8 w-8" />}
                title="Sin metas"
                description="Crea tu primera meta de estudio"
                action={
                  <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Meta
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {goalsList.map(goal => {
                  const progress = calculateProgress(goal);
                  const TypeIcon = getTypeIcon(goal.type);

                  return (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              goal.status === 'COMPLETED' ? "bg-emerald-100" :
                              goal.status === 'ACTIVE' ? "bg-blue-100" :
                              goal.status === 'FAILED' ? "bg-red-100" : "bg-secondary-100"
                            )}>
                              <TypeIcon className={cn(
                                "h-5 w-5",
                                goal.status === 'COMPLETED' ? "text-emerald-600" :
                                goal.status === 'ACTIVE' ? "text-blue-600" :
                                goal.status === 'FAILED' ? "text-red-600" : "text-secondary-600"
                              )} />
                            </div>
                            <div>
                              <h3 className="font-medium text-secondary-900">{goal.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-secondary-500">
                                <span>{getTypeLabel(goal.type)}</span>
                                <span>•</span>
                                <span>{progress.toFixed(0)}% completado</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(goal.status)}
                            {goal.status === 'PAUSED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateStatus(goal, 'ACTIVE')}
                              >
                                <Play className="h-4 w-4 text-emerald-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(goal.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* Suggestions */}
          {activeTab === 'suggestions' && (
            suggestions.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-8 w-8" />}
                title="Sin sugerencias"
                description="Las sugerencias aparecerán basadas en tu actividad"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion, idx) => {
                  const TypeIcon = getTypeIcon(suggestion.type);

                  return (
                    <Card key={idx} className="group hover:shadow-lg transition-all overflow-hidden">
                      <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <TypeIcon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-900">{suggestion.title}</h3>
                            <p className="text-sm text-secondary-500">{getTypeLabel(suggestion.type)}</p>
                          </div>
                        </div>

                        <p className="text-secondary-600 text-sm mb-3">{suggestion.description}</p>

                        <div className="flex items-center gap-2 text-sm text-secondary-500 mb-4">
                          <Badge variant="outline">
                            {suggestion.targetValue} {getUnitLabel(suggestion.unit, suggestion.targetValue)}
                          </Badge>
                          <Badge variant="outline">
                            {getPeriodLabel(suggestion.periodType)}
                          </Badge>
                        </div>

                        <div className="p-3 bg-purple-50 rounded-lg mb-4">
                          <p className="text-sm text-purple-700">
                            <Sparkles className="h-4 w-4 inline mr-1" />
                            {suggestion.reason}
                          </p>
                        </div>

                        <Button
                          variant="gradient"
                          className="w-full"
                          onClick={() => handleCreateFromSuggestion(suggestion)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Meta
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm(); }}
        title="Nueva Meta de Estudio"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
            <Input
              placeholder="Ej: Estudiar 20 horas esta semana"
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Descripción</label>
            <Input
              placeholder="Detalles adicionales..."
              value={createForm.description}
              onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Tipo de meta</label>
              <Select
                value={createForm.type}
                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as GoalType }))}
                options={[
                  { value: 'STUDY_HOURS', label: 'Horas de estudio' },
                  { value: 'FLASHCARDS_REVIEW', label: 'Revisar flashcards' },
                  { value: 'QUIZZES_COMPLETE', label: 'Completar quizzes' },
                  { value: 'PAGES_READ', label: 'Páginas leídas' },
                  { value: 'POMODOROS', label: 'Pomodoros' },
                  { value: 'TASKS_COMPLETE', label: 'Tareas completadas' },
                  { value: 'CUSTOM', label: 'Personalizado' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Período</label>
              <Select
                value={createForm.periodType}
                onChange={(e) => setCreateForm(prev => ({ ...prev, periodType: e.target.value as GoalPeriod }))}
                options={[
                  { value: 'DAILY', label: 'Diario' },
                  { value: 'WEEKLY', label: 'Semanal' },
                  { value: 'MONTHLY', label: 'Mensual' },
                  { value: 'SEMESTER', label: 'Semestral' },
                  { value: 'CUSTOM', label: 'Personalizado' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Meta *</label>
              <Input
                type="number"
                placeholder="20"
                value={createForm.targetValue}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetValue: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Unidad</label>
              <Select
                value={createForm.unit}
                onChange={(e) => setCreateForm(prev => ({ ...prev, unit: e.target.value as GoalUnit }))}
                options={[
                  { value: 'HOURS', label: 'Horas' },
                  { value: 'MINUTES', label: 'Minutos' },
                  { value: 'COUNT', label: 'Cantidad' },
                  { value: 'PAGES', label: 'Páginas' },
                  { value: 'PERCENTAGE', label: 'Porcentaje' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fecha inicio</label>
              <Input
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fecha fin</label>
              <Input
                type="date"
                value={createForm.endDate}
                onChange={(e) => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Materia (opcional)</label>
            <Select
              value={createForm.subjectId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Sin materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createForm.reminderEnabled}
                onChange={(e) => setCreateForm(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Activar recordatorios</span>
            </label>
            {createForm.reminderEnabled && (
              <Input
                type="time"
                value={createForm.reminderTime}
                onChange={(e) => setCreateForm(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="w-32"
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleCreate}
              disabled={!createForm.title || !createForm.targetValue}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Meta
            </Button>
          </div>
        </div>
      </Modal>

      {/* Progress Modal */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => { setIsProgressModalOpen(false); setSelectedGoal(null); }}
        title="Agregar Progreso"
        size="sm"
      >
        {selectedGoal && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-xl">
              <p className="font-medium text-secondary-900">{selectedGoal.title}</p>
              <p className="text-sm text-secondary-500">
                Progreso actual: {selectedGoal.currentValue} / {selectedGoal.targetValue} {getUnitLabel(selectedGoal.unit, selectedGoal.targetValue)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Cantidad a agregar *
              </label>
              <Input
                type="number"
                placeholder="5"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Notas (opcional)
              </label>
              <Input
                placeholder="Detalles del progreso..."
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsProgressModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleAddProgress}
                disabled={!progressValue}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
