'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { studySessions, StudySession, StudySessionType, SessionStats, DayStats, subjects as subjectsApi, Subject } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  Loader2,
  Coffee,
  Brain,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Star,
  History,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'timer' | 'history' | 'stats';

const SESSION_PRESETS = [
  { type: 'POMODORO' as StudySessionType, label: 'Pomodoro', duration: 25, break: 5, icon: Timer, color: 'from-red-500 to-orange-500' },
  { type: 'DEEP_WORK' as StudySessionType, label: 'Deep Work', duration: 90, break: 20, icon: Brain, color: 'from-purple-500 to-indigo-500' },
  { type: 'EXAM_MODE' as StudySessionType, label: 'Modo Examen', duration: 60, break: 10, icon: Zap, color: 'from-amber-500 to-yellow-500' },
  { type: 'CUSTOM' as StudySessionType, label: 'Personalizado', duration: 0, break: 5, icon: Settings, color: 'from-slate-500 to-gray-600' },
];

export default function TimerPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Timer state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Settings
  const [selectedPreset, setSelectedPreset] = useState(SESSION_PRESETS[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [customDuration, setCustomDuration] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Stats & History
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [todayStats, setTodayStats] = useState<DayStats | null>(null);
  const [weekStats, setWeekStats] = useState<DayStats[]>([]);
  const [history, setHistory] = useState<StudySession[]>([]);

  // End session modal
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [focusScore, setFocusScore] = useState(80);
  const [sessionNotes, setSessionNotes] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [active, sessionStats, today, week, hist] = await Promise.all([
        studySessions.getActive(token),
        studySessions.getStats(token),
        studySessions.getTodayStats(token),
        studySessions.getWeekStats(token),
        studySessions.getHistory(token, { limit: 20 }),
      ]);
      setActiveSession(active);
      setStats(sessionStats);
      setTodayStats(today);
      setWeekStats(Array.isArray(week) ? week : []);
      setHistory(Array.isArray(hist) ? hist : []);

      if (active && active.status === 'ACTIVE') {
        const elapsed = Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000);
        const remaining = Math.max(0, active.targetMinutes * 60 - elapsed);
        setTimeLeft(remaining);
        setIsRunning(true);
      }
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

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer finished
      if (!isBreak && activeSession) {
        // Study session finished, start break
        playNotification();
        setIsBreak(true);
        const breakDuration = isCustomMode ? customBreak : selectedPreset.break;
        setTimeLeft(breakDuration * 60);
      } else if (isBreak) {
        // Break finished
        playNotification();
        setIsBreak(false);
        setIsEndModalOpen(true);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, timeLeft, isBreak, activeSession, selectedPreset.break, isCustomMode, customBreak]);

  const playNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(isBreak ? '¡Descanso terminado!' : '¡Sesión completada!', {
        body: isBreak ? 'Es hora de volver a estudiar' : 'Tómate un descanso',
        icon: '/icons/icon-192x192.png',
      });
    }
    // Play sound
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {});
  };

  // Start session
  const handleStart = async () => {
    if (!token) return;
    if (customDuration < 1) {
      alert('La duración debe ser al menos 1 minuto');
      return;
    }
    try {
      const breakDuration = isCustomMode ? customBreak : selectedPreset.break;
      const session = await studySessions.start(token, {
        subjectId: selectedSubject || undefined,
        type: selectedPreset.type,
        targetMinutes: customDuration,
        breakMinutes: breakDuration,
      });
      setActiveSession(session);
      setTimeLeft(customDuration * 60);
      setIsRunning(true);
      setIsBreak(false);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  // Pause session
  const handlePause = async () => {
    if (!token || !activeSession) return;
    try {
      await studySessions.pause(token, activeSession.id);
      setIsRunning(false);
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  // Resume session
  const handleResume = async () => {
    if (!token || !activeSession) return;
    try {
      await studySessions.resume(token, activeSession.id);
      setIsRunning(true);
    } catch (error) {
      console.error('Error resuming:', error);
    }
  };

  // End session
  const handleEnd = async () => {
    if (!token || !activeSession) return;
    try {
      await studySessions.end(token, activeSession.id, {
        focusScore,
        notes: sessionNotes || undefined,
      });
      setActiveSession(null);
      setIsRunning(false);
      setTimeLeft(0);
      setIsEndModalOpen(false);
      setFocusScore(80);
      setSessionNotes('');
      loadData();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Abandon session
  const handleAbandon = async () => {
    if (!token || !activeSession) return;
    try {
      await studySessions.abandon(token, activeSession.id);
      setActiveSession(null);
      setIsRunning(false);
      setTimeLeft(0);
      loadData();
    } catch (error) {
      console.error('Error abandoning:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeLabel = (type: StudySessionType) => {
    const labels: Record<StudySessionType, string> = {
      POMODORO: 'Pomodoro',
      DEEP_WORK: 'Deep Work',
      EXAM_MODE: 'Modo Examen',
      CUSTOM: 'Personalizado',
    };
    return labels[type];
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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-red-50/80 via-white to-orange-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Timer className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                  Timer de Estudio
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">Pomodoro y sesiones de enfoque</p>
            </div>
          </div>

          {/* Today Stats */}
          {todayStats && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Hoy</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{todayStats.minutes} min</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-sm font-medium">Sesiones</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{todayStats.sessions}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-secondary-100">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-medium">Enfoque</span>
                </div>
                <p className="text-2xl font-bold text-secondary-900">{todayStats.focusScore}%</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'timer', label: 'Timer', icon: Timer },
              { id: 'history', label: 'Historial', icon: History },
              { id: 'stats', label: 'Estadísticas', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-red-600"
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
        <div className="max-w-4xl mx-auto">
          {/* Timer Tab */}
          {activeTab === 'timer' && (
            <div className="flex flex-col items-center">
              {/* Presets */}
              {!activeSession && (
                <div className="w-full max-w-2xl mb-8">
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {SESSION_PRESETS.map(preset => (
                      <button
                        key={preset.type}
                        onClick={() => {
                          setSelectedPreset(preset);
                          if (preset.type === 'CUSTOM') {
                            setIsCustomMode(true);
                            if (customDuration === 0 || customDuration === 25 || customDuration === 90 || customDuration === 60) {
                              setCustomDuration(30);
                            }
                          } else {
                            setIsCustomMode(false);
                            setCustomDuration(preset.duration);
                            setCustomBreak(preset.break);
                          }
                        }}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all",
                          selectedPreset.type === preset.type
                            ? "border-red-500 bg-red-50"
                            : "border-secondary-200 hover:border-secondary-300"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2", preset.color)}>
                          <preset.icon className="h-6 w-6 text-white" />
                        </div>
                        <p className="font-medium text-secondary-900">{preset.label}</p>
                        <p className="text-sm text-secondary-500">
                          {preset.type === 'CUSTOM' ? 'Tú eliges' : `${preset.duration} min`}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Custom Time Inputs */}
                  {isCustomMode && (
                    <div className="bg-secondary-50 rounded-2xl p-6 border border-secondary-200">
                      <h3 className="text-lg font-semibold text-secondary-900 mb-4 text-center">
                        Configura tu tiempo
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Duración de estudio
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setCustomDuration(prev => Math.max(1, prev - 5))}
                              className="w-10 h-10 rounded-lg bg-secondary-200 hover:bg-secondary-300 flex items-center justify-center font-bold text-secondary-700 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="480"
                              value={customDuration}
                              onChange={(e) => setCustomDuration(Math.max(1, Math.min(480, parseInt(e.target.value) || 1)))}
                              className="w-20 h-10 text-center text-xl font-bold border border-secondary-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <button
                              onClick={() => setCustomDuration(prev => Math.min(480, prev + 5))}
                              className="w-10 h-10 rounded-lg bg-secondary-200 hover:bg-secondary-300 flex items-center justify-center font-bold text-secondary-700 transition-colors"
                            >
                              +
                            </button>
                            <span className="text-secondary-500 font-medium">min</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {[15, 30, 45, 60, 90, 120].map(min => (
                              <button
                                key={min}
                                onClick={() => setCustomDuration(min)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-lg transition-colors",
                                  customDuration === min
                                    ? "bg-red-500 text-white"
                                    : "bg-secondary-200 text-secondary-600 hover:bg-secondary-300"
                                )}
                              >
                                {min}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Descanso
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setCustomBreak(prev => Math.max(1, prev - 1))}
                              className="w-10 h-10 rounded-lg bg-secondary-200 hover:bg-secondary-300 flex items-center justify-center font-bold text-secondary-700 transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={customBreak}
                              onChange={(e) => setCustomBreak(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                              className="w-20 h-10 text-center text-xl font-bold border border-secondary-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <button
                              onClick={() => setCustomBreak(prev => Math.min(60, prev + 1))}
                              className="w-10 h-10 rounded-lg bg-secondary-200 hover:bg-secondary-300 flex items-center justify-center font-bold text-secondary-700 transition-colors"
                            >
                              +
                            </button>
                            <span className="text-secondary-500 font-medium">min</span>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {[5, 10, 15, 20, 30].map(min => (
                              <button
                                key={min}
                                onClick={() => setCustomBreak(min)}
                                className={cn(
                                  "px-2 py-1 text-xs rounded-lg transition-colors",
                                  customBreak === min
                                    ? "bg-emerald-500 text-white"
                                    : "bg-secondary-200 text-secondary-600 hover:bg-secondary-300"
                                )}
                              >
                                {min}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timer Display */}
              <Card className="w-full max-w-md mb-8">
                <CardContent className="p-8">
                  <div className="text-center">
                    {isBreak && (
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Coffee className="h-5 w-5 text-emerald-500" />
                        <span className="text-emerald-600 font-medium">Tiempo de descanso</span>
                      </div>
                    )}

                    <div className={cn(
                      "text-8xl font-bold tracking-tight mb-8",
                      isBreak ? "text-emerald-500" : "text-secondary-900"
                    )}>
                      {formatTime(timeLeft || customDuration * 60)}
                    </div>

                    {/* Progress Ring */}
                    <div className="relative w-64 h-64 mx-auto mb-8">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="128"
                          cy="128"
                          r="120"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="128"
                          cy="128"
                          r="120"
                          fill="none"
                          stroke={isBreak ? "#10b981" : "#ef4444"}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 120}
                          strokeDashoffset={
                            (() => {
                              const circumference = 2 * Math.PI * 120;
                              if (!activeSession) return 0;
                              const totalSeconds = (activeSession.targetMinutes || customDuration || 25) * 60;
                              if (totalSeconds <= 0) return 0;
                              const progress = Math.max(0, Math.min(1, timeLeft / totalSeconds));
                              return circumference * (1 - progress);
                            })()
                          }
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-4xl font-bold text-secondary-900">{formatTime(timeLeft || customDuration * 60)}</p>
                          {activeSession && (
                            <p className="text-sm text-secondary-500 mt-1">
                              {getSessionTypeLabel(activeSession.type)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                      {!activeSession ? (
                        <>
                          <Select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            options={[
                              { value: '', label: 'Sin materia' },
                              ...subjects.map(s => ({ value: s.id, label: s.name })),
                            ]}
                            className="w-48"
                          />
                          <Button variant="gradient" size="lg" onClick={handleStart}>
                            <Play className="h-5 w-5 mr-2" />
                            Iniciar
                          </Button>
                        </>
                      ) : (
                        <>
                          {isRunning ? (
                            <Button variant="outline" size="lg" onClick={handlePause}>
                              <Pause className="h-5 w-5 mr-2" />
                              Pausar
                            </Button>
                          ) : (
                            <Button variant="gradient" size="lg" onClick={handleResume}>
                              <Play className="h-5 w-5 mr-2" />
                              Continuar
                            </Button>
                          )}
                          <Button variant="outline" size="lg" onClick={() => setIsEndModalOpen(true)}>
                            <Square className="h-5 w-5 mr-2" />
                            Terminar
                          </Button>
                          <Button variant="ghost" size="lg" onClick={handleAbandon}>
                            <RotateCcw className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            history.length === 0 ? (
              <EmptyState
                icon={<History className="h-8 w-8" />}
                title="Sin historial"
                description="Completa tu primera sesión de estudio"
              />
            ) : (
              <div className="space-y-3">
                {history.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            session.status === 'COMPLETED' ? "bg-emerald-100" : "bg-secondary-100"
                          )}>
                            <Timer className={cn(
                              "h-5 w-5",
                              session.status === 'COMPLETED' ? "text-emerald-600" : "text-secondary-600"
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-secondary-900">
                                {getSessionTypeLabel(session.type)}
                              </h4>
                              <Badge variant={session.status === 'COMPLETED' ? 'success' : 'secondary'}>
                                {session.status === 'COMPLETED' ? 'Completada' : 'Abandonada'}
                              </Badge>
                            </div>
                            <p className="text-sm text-secondary-500">
                              {new Date(session.startedAt).toLocaleDateString()} • {session.actualMinutes} min
                              {session.subject && ` • ${session.subject.name}`}
                            </p>
                          </div>
                        </div>
                        {session.focusScore && (
                          <div className="text-right">
                            <p className="text-sm text-secondary-500">Enfoque</p>
                            <p className={cn(
                              "font-bold",
                              session.focusScore >= 80 ? "text-emerald-600" :
                              session.focusScore >= 60 ? "text-amber-600" : "text-red-600"
                            )}>
                              {session.focusScore}%
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalMinutes}</p>
                    <p className="text-sm text-secondary-500">Minutos totales</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{stats.totalSessions}</p>
                    <p className="text-sm text-secondary-500">Sesiones</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Star className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{stats.averageFocusScore}%</p>
                    <p className="text-sm text-secondary-500">Enfoque promedio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-secondary-900">{stats.completionRate}%</p>
                    <p className="text-sm text-secondary-500">Completadas</p>
                  </CardContent>
                </Card>
              </div>

              {/* Week Chart */}
              {weekStats.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Esta semana</h3>
                    <div className="flex items-end justify-between h-40 gap-2">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, idx) => {
                        const dayData = weekStats[idx] || { minutes: 0 };
                        const maxMinutes = Math.max(...weekStats.map(d => d.minutes), 60);
                        const height = (dayData.minutes / maxMinutes) * 100;

                        return (
                          <div key={day} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-secondary-100 rounded-t relative" style={{ height: '120px' }}>
                              <div
                                className="absolute bottom-0 w-full bg-gradient-to-t from-red-500 to-orange-500 rounded-t transition-all"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <p className="text-xs text-secondary-500 mt-2">{day}</p>
                            <p className="text-xs font-medium text-secondary-700">{dayData.minutes}m</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* End Session Modal */}
      <Modal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        title="Finalizar Sesión"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ¿Qué tan enfocado estuviste?
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={focusScore}
              onChange={(e) => setFocusScore(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-secondary-500 mt-1">
              <span>Distraído</span>
              <span className="font-bold text-secondary-900">{focusScore}%</span>
              <span>Muy enfocado</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              className="w-full h-20 p-3 border border-secondary-200 rounded-lg resize-none"
              placeholder="¿Qué estudiaste? ¿Cómo te fue?"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEndModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleEnd}>
              Guardar y Terminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
