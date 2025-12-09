'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { tasks, Task, TaskStats, TaskPriority, TaskStatus, subjects as subjectsApi, Subject } from '@/lib/api';
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
  CheckSquare,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Circle,
  Flag,
  Filter,
  MoreHorizontal,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'all' | 'upcoming' | 'overdue';

export default function TasksPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterSubject, setFilterSubject] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    priority: 'MEDIUM' as TaskPriority,
    tags: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (filterSubject) filters.subjectId = filterSubject;

      const [all, upcoming, overdue, taskStats] = await Promise.all([
        tasks.list(token, filters),
        tasks.getUpcoming(token, 7),
        tasks.getOverdue(token),
        tasks.getStats(token),
      ]);
      setTasksList(Array.isArray(all) ? all : []);
      setUpcomingTasks(Array.isArray(upcoming) ? upcoming : []);
      setOverdueTasks(Array.isArray(overdue) ? overdue : []);
      setStats(taskStats);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, filterStatus, filterPriority, filterSubject]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
      loadData();
    }
  }, [token, loadData]);

  // Create task
  const handleCreate = async () => {
    if (!token || !form.title) return;
    try {
      await tasks.create(token, {
        title: form.title,
        description: form.description || undefined,
        subjectId: form.subjectId || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  // Update task
  const handleUpdate = async () => {
    if (!token || !editingTask) return;
    try {
      await tasks.update(token, editingTask.id, {
        title: form.title,
        description: form.description || undefined,
        subjectId: form.subjectId || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : undefined,
      });
      setEditingTask(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating:', error);
    }
  };

  // Complete task
  const handleComplete = async (id: string) => {
    if (!token) return;
    try {
      await tasks.complete(token, id);
      loadData();
    } catch (error) {
      console.error('Error completing:', error);
    }
  };

  // Delete task
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await tasks.delete(token, id);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      subjectId: '',
      dueDate: '',
      priority: 'MEDIUM',
      tags: '',
    });
  };

  const openEditModal = (task: Task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      subjectId: task.subjectId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      priority: task.priority,
      tags: task.tags.join(', '),
    });
    setEditingTask(task);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const config: Record<TaskPriority, { color: string; label: string }> = {
      LOW: { color: 'secondary', label: 'Baja' },
      MEDIUM: { color: 'primary', label: 'Media' },
      HIGH: { color: 'warning', label: 'Alta' },
      URGENT: { color: 'error', label: 'Urgente' },
    };
    const { color, label } = config[priority];
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getStatusBadge = (status: TaskStatus) => {
    const config: Record<TaskStatus, { color: string; label: string }> = {
      PENDING: { color: 'warning', label: 'Pendiente' },
      IN_PROGRESS: { color: 'primary', label: 'En progreso' },
      COMPLETED: { color: 'success', label: 'Completada' },
      CANCELLED: { color: 'secondary', label: 'Cancelada' },
    };
    const { color, label } = config[status];
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const displayTasks = activeTab === 'upcoming' ? upcomingTasks : activeTab === 'overdue' ? overdueTasks : tasksList;

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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-orange-50/80 via-white to-red-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <CheckSquare className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                    Tareas
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Organiza y completa tus pendientes</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-secondary-600 mb-1">
                  <Circle className="h-4 w-4" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.pending}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Vencidas</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.overdue}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Completadas</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{stats.completionRate}%</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Todas', icon: CheckSquare },
              { id: 'upcoming', label: 'Próximas', icon: Calendar },
              { id: 'overdue', label: 'Vencidas', icon: AlertTriangle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-orange-600"
                    : "text-secondary-600 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'overdue' && overdueTasks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {overdueTasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Filters */}
          {activeTab === 'all' && (
            <div className="flex items-center gap-4 mb-6">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'PENDING', label: 'Pendiente' },
                  { value: 'IN_PROGRESS', label: 'En progreso' },
                  { value: 'COMPLETED', label: 'Completada' },
                ]}
                className="w-40"
              />
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
                options={[
                  { value: '', label: 'Todas las prioridades' },
                  { value: 'URGENT', label: 'Urgente' },
                  { value: 'HIGH', label: 'Alta' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'LOW', label: 'Baja' },
                ]}
                className="w-40"
              />
              <Select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                options={[
                  { value: '', label: 'Todas las materias' },
                  ...subjects.map(s => ({ value: s.id, label: s.name })),
                ]}
                className="w-48"
              />
            </div>
          )}

          {/* Tasks List */}
          {displayTasks.length === 0 ? (
            <EmptyState
              icon={<CheckSquare className="h-8 w-8" />}
              title={activeTab === 'overdue' ? 'Sin tareas vencidas' : 'Sin tareas'}
              description={activeTab === 'overdue' ? 'No tienes tareas vencidas' : 'Crea tu primera tarea'}
              action={
                activeTab !== 'overdue' && (
                  <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Tarea
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {displayTasks.map(task => {
                const daysUntil = task.dueDate ? getDaysUntilDue(task.dueDate) : null;
                const isOverdue = daysUntil !== null && daysUntil < 0 && task.status !== 'COMPLETED';

                return (
                  <Card key={task.id} className={cn(
                    "hover:shadow-md transition-all",
                    task.status === 'COMPLETED' && "opacity-60"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => task.status !== 'COMPLETED' && handleComplete(task.id)}
                          className={cn(
                            "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            task.status === 'COMPLETED'
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-secondary-300 hover:border-emerald-500"
                          )}
                        >
                          {task.status === 'COMPLETED' && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className={cn(
                                "font-medium text-secondary-900",
                                task.status === 'COMPLETED' && "line-through"
                              )}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-secondary-500 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(task)}>
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 mt-3">
                            {getPriorityBadge(task.priority)}
                            {getStatusBadge(task.status)}
                            {task.subject && (
                              <Badge variant="outline">
                                {task.subject.name}
                              </Badge>
                            )}
                            {task.dueDate && (
                              <span className={cn(
                                "flex items-center gap-1 text-sm",
                                isOverdue ? "text-red-500" : daysUntil !== null && daysUntil <= 3 ? "text-amber-500" : "text-secondary-500"
                              )}>
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                                {isOverdue && ' (vencida)'}
                              </span>
                            )}
                          </div>

                          {task.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <Tag className="h-3 w-3 text-secondary-400" />
                              {task.tags.map(tag => (
                                <span key={tag} className="text-xs text-secondary-500">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingTask}
        onClose={() => { setIsCreateModalOpen(false); setEditingTask(null); resetForm(); }}
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
            <Input
              placeholder="¿Qué necesitas hacer?"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Descripción</label>
            <textarea
              className="w-full h-24 p-3 border border-secondary-200 rounded-lg resize-none"
              placeholder="Detalles adicionales..."
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fecha límite</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Prioridad</label>
              <Select
                value={form.priority}
                onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                options={[
                  { value: 'LOW', label: 'Baja' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'HIGH', label: 'Alta' },
                  { value: 'URGENT', label: 'Urgente' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Materia</label>
            <Select
              value={form.subjectId}
              onChange={(e) => setForm(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Sin materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Tags (separados por comas)</label>
            <Input
              placeholder="examen, importante, proyecto..."
              value={form.tags}
              onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); setEditingTask(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={editingTask ? handleUpdate : handleCreate}
              disabled={!form.title}
            >
              {editingTask ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
