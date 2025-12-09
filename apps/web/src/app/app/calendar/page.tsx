'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
} from '@/components/ui';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  Target,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
  X,
  Save,
  Bell,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Event types
type EventType = 'exam' | 'assignment' | 'study' | 'reminder' | 'class';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time?: string;
  endTime?: string;
  type: EventType;
  subjectId?: string;
  subjectName?: string;
  color?: string;
  completed?: boolean;
}

const EVENT_TYPES: { value: EventType; label: string; icon: typeof CalendarIcon; color: string }[] = [
  { value: 'exam', label: 'Examen', icon: AlertCircle, color: 'rose' },
  { value: 'assignment', label: 'Tarea', icon: FileText, color: 'amber' },
  { value: 'study', label: 'Estudio', icon: BookOpen, color: 'emerald' },
  { value: 'class', label: 'Clase', icon: GraduationCap, color: 'blue' },
  { value: 'reminder', label: 'Recordatorio', icon: Bell, color: 'violet' },
];

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function getEventTypeConfig(type: EventType) {
  return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0];
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  // Add days from previous month to fill first week
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Add days from next month to complete grid (6 rows)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isToday(date: Date): boolean {
  const today = new Date();
  return formatDateKey(date) === formatDateKey(today);
}

function isSameMonth(date: Date, month: number): boolean {
  return date.getMonth() === month;
}

export default function CalendarPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    type: 'study',
    title: '',
    date: '',
    time: '',
  });

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
    }
  }, [token]);

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage
  const saveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('calendar-events', JSON.stringify(newEvents));
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      const key = event.date;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const openNewEventModal = (date?: Date) => {
    setEditingEvent(null);
    setNewEvent({
      type: 'study',
      title: '',
      date: date ? formatDateKey(date) : formatDateKey(new Date()),
      time: '',
    });
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({ ...event });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    const eventToSave: CalendarEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: newEvent.title!,
      description: newEvent.description,
      date: newEvent.date!,
      time: newEvent.time,
      endTime: newEvent.endTime,
      type: newEvent.type as EventType,
      subjectId: newEvent.subjectId,
      subjectName: subjects.find(s => s.id === newEvent.subjectId)?.name,
      completed: newEvent.completed || false,
    };

    let updatedEvents: CalendarEvent[];
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? eventToSave : e);
    } else {
      updatedEvents = [...events, eventToSave];
    }

    saveEvents(updatedEvents);
    setIsEventModalOpen(false);
    setNewEvent({ type: 'study', title: '', date: '', time: '' });
  };

  const handleDeleteEvent = (eventId: string) => {
    saveEvents(events.filter(e => e.id !== eventId));
  };

  const toggleEventComplete = (eventId: string) => {
    saveEvents(events.map(e =>
      e.id === eventId ? { ...e, completed: !e.completed } : e
    ));
  };

  const selectedDateEvents = selectedDate ? eventsByDate[formatDateKey(selectedDate)] || [] : [];
  const todayEvents = eventsByDate[formatDateKey(new Date())] || [];
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date() && !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const subjectOptions = [
    { value: '', label: 'Sin materia' },
    ...subjects.map(s => ({ value: s.id, label: s.name })),
  ];

  const typeOptions = EVENT_TYPES.map(t => ({ value: t.value, label: t.label }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-orange-50/80 via-white to-red-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <CalendarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                    Calendario
                  </span> Académico
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Organiza tus exámenes, tareas y sesiones de estudio
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => openNewEventModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo evento
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-secondary-900">
                        {MONTHS_ES[currentMonth]} {currentYear}
                      </h2>
                      <Button variant="outline" size="sm" onClick={goToToday}>
                        Hoy
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5 text-secondary-600" />
                      </button>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5 text-secondary-600" />
                      </button>
                    </div>
                  </div>

                  {/* Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS_ES.map(day => (
                      <div
                        key={day}
                        className="py-2 text-center text-sm font-semibold text-secondary-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((date, index) => {
                      const dateKey = formatDateKey(date);
                      const dayEvents = eventsByDate[dateKey] || [];
                      const isCurrentMonth = isSameMonth(date, currentMonth);
                      const isTodayDate = isToday(date);
                      const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedDate(date)}
                          onDoubleClick={() => openNewEventModal(date)}
                          className={cn(
                            'min-h-[100px] p-2 rounded-xl text-left transition-all duration-200 border-2',
                            isCurrentMonth
                              ? 'bg-white hover:bg-secondary-50'
                              : 'bg-secondary-50/50 text-secondary-400',
                            isTodayDate && 'ring-2 ring-orange-500 ring-offset-2',
                            isSelected
                              ? 'border-orange-500 bg-orange-50/50'
                              : 'border-transparent'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium',
                              isTodayDate && 'bg-gradient-to-br from-orange-500 to-red-500 text-white',
                              !isTodayDate && isCurrentMonth && 'text-secondary-900',
                              !isTodayDate && !isCurrentMonth && 'text-secondary-400'
                            )}
                          >
                            {date.getDate()}
                          </span>

                          {/* Event indicators */}
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 3).map(event => {
                              const config = getEventTypeConfig(event.type);
                              return (
                                <div
                                  key={event.id}
                                  className={cn(
                                    'text-xs px-1.5 py-0.5 rounded truncate',
                                    event.completed && 'line-through opacity-50',
                                    config.color === 'rose' && 'bg-rose-100 text-rose-700',
                                    config.color === 'amber' && 'bg-amber-100 text-amber-700',
                                    config.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                                    config.color === 'blue' && 'bg-blue-100 text-blue-700',
                                    config.color === 'violet' && 'bg-violet-100 text-violet-700'
                                  )}
                                >
                                  {event.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <div className="text-xs text-secondary-500 px-1.5">
                                +{dayEvents.length - 3} más
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Selected Date Events */}
              {selectedDate && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-secondary-900">
                        {selectedDate.getDate()} de {MONTHS_ES[selectedDate.getMonth()]}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNewEventModal(selectedDate)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {selectedDateEvents.length === 0 ? (
                      <p className="text-sm text-secondary-500 text-center py-4">
                        No hay eventos para este día
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateEvents.map(event => {
                          const config = getEventTypeConfig(event.type);
                          const Icon = config.icon;
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                'p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md',
                                event.completed
                                  ? 'bg-secondary-50 border-secondary-200 opacity-60'
                                  : 'bg-white border-secondary-200'
                              )}
                              onClick={() => openEditEventModal(event)}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                    config.color === 'rose' && 'bg-rose-100 text-rose-600',
                                    config.color === 'amber' && 'bg-amber-100 text-amber-600',
                                    config.color === 'emerald' && 'bg-emerald-100 text-emerald-600',
                                    config.color === 'blue' && 'bg-blue-100 text-blue-600',
                                    config.color === 'violet' && 'bg-violet-100 text-violet-600'
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'font-medium text-sm',
                                    event.completed && 'line-through'
                                  )}>
                                    {event.title}
                                  </p>
                                  {event.time && (
                                    <p className="text-xs text-secondary-500 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {event.time}
                                      {event.endTime && ` - ${event.endTime}`}
                                    </p>
                                  )}
                                  {event.subjectName && (
                                    <Badge variant="secondary" className="mt-1 text-xs">
                                      {event.subjectName}
                                    </Badge>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEventComplete(event.id);
                                  }}
                                  className={cn(
                                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                    event.completed
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-secondary-300 hover:border-emerald-500'
                                  )}
                                >
                                  {event.completed && (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Today's Events */}
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-100">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-orange-500" />
                    Hoy
                  </h3>
                  {todayEvents.length === 0 ? (
                    <p className="text-sm text-secondary-500">No hay eventos hoy</p>
                  ) : (
                    <div className="space-y-2">
                      {todayEvents.map(event => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-sm p-2 rounded-lg bg-white/80',
                            event.completed && 'line-through opacity-50'
                          )}
                        >
                          <span className="font-medium">{event.title}</span>
                          {event.time && (
                            <span className="text-secondary-500 ml-2">{event.time}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 flex items-center gap-2 mb-4">
                    <CalendarIcon className="h-5 w-5 text-primary-500" />
                    Próximos eventos
                  </h3>
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-secondary-500">No hay eventos próximos</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.map(event => {
                        const config = getEventTypeConfig(event.type);
                        const eventDate = new Date(event.date);
                        return (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 cursor-pointer hover:bg-secondary-50 rounded-lg p-2 -m-2 transition-colors"
                            onClick={() => {
                              setSelectedDate(eventDate);
                              setCurrentDate(eventDate);
                            }}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs',
                              config.color === 'rose' && 'bg-rose-100 text-rose-700',
                              config.color === 'amber' && 'bg-amber-100 text-amber-700',
                              config.color === 'emerald' && 'bg-emerald-100 text-emerald-700',
                              config.color === 'blue' && 'bg-blue-100 text-blue-700',
                              config.color === 'violet' && 'bg-violet-100 text-violet-700'
                            )}>
                              <span className="font-bold">{eventDate.getDate()}</span>
                              <span className="text-[10px]">{MONTHS_ES[eventDate.getMonth()].slice(0, 3)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-secondary-500">
                                {config.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-4">Este mes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-rose-50 rounded-xl">
                      <p className="text-2xl font-bold text-rose-600">
                        {events.filter(e => {
                          const d = new Date(e.date);
                          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.type === 'exam';
                        }).length}
                      </p>
                      <p className="text-xs text-rose-600">Exámenes</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                      <p className="text-2xl font-bold text-amber-600">
                        {events.filter(e => {
                          const d = new Date(e.date);
                          return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.type === 'assignment';
                        }).length}
                      </p>
                      <p className="text-xs text-amber-600">Tareas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Editar evento' : 'Nuevo evento'}
        description="Agrega detalles del evento"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Título *
            </label>
            <Input
              placeholder="Nombre del evento"
              value={newEvent.title || ''}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tipo *
              </label>
              <Select
                options={typeOptions}
                value={newEvent.type || 'study'}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Materia
              </label>
              <Select
                options={subjectOptions}
                value={newEvent.subjectId || ''}
                onChange={(e) => setNewEvent({ ...newEvent, subjectId: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Fecha *
              </label>
              <Input
                type="date"
                value={newEvent.date || ''}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Hora inicio
              </label>
              <Input
                type="time"
                value={newEvent.time || ''}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Hora fin
              </label>
              <Input
                type="time"
                value={newEvent.endTime || ''}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Detalles adicionales..."
              value={newEvent.description || ''}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-secondary-100">
            {editingEvent && (
              <Button
                variant="outline"
                onClick={() => {
                  handleDeleteEvent(editingEvent.id);
                  setIsEventModalOpen(false);
                }}
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <div className={cn('flex gap-3', !editingEvent && 'ml-auto')}>
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSaveEvent}
                disabled={!newEvent.title || !newEvent.date}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingEvent ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
