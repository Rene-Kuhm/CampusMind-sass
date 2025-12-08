'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  Modal,
} from '@/components/ui';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  Zap,
  Target,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Flame,
  Timer,
  BookOpen,
  ChevronUp,
  ChevronDown,
  X,
  Save,
  SkipForward,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Timer modes
type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focus: { hours: number; minutes: number; seconds: number };
  shortBreak: { hours: number; minutes: number; seconds: number };
  longBreak: { hours: number; minutes: number; seconds: number };
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  longBreakInterval: number;
  soundEnabled: boolean;
  soundVolume: number;
}

interface PomodoroSession {
  id: string;
  mode: TimerMode;
  duration: number;
  completedAt: Date;
  subjectId?: string;
  subjectName?: string;
}

interface DailyStats {
  date: string;
  focusMinutes: number;
  sessionsCompleted: number;
  streak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focus: { hours: 0, minutes: 25, seconds: 0 },
  shortBreak: { hours: 0, minutes: 5, seconds: 0 },
  longBreak: { hours: 0, minutes: 15, seconds: 0 },
  autoStartBreaks: false,
  autoStartFocus: false,
  longBreakInterval: 4,
  soundEnabled: true,
  soundVolume: 50,
};

const MODE_CONFIG = {
  focus: {
    label: 'Enfoque',
    icon: Brain,
    gradient: 'from-rose-500 to-orange-500',
    bgGradient: 'from-rose-50 to-orange-50',
    ringColor: 'stroke-rose-500',
    description: 'Tiempo de concentración profunda',
  },
  shortBreak: {
    label: 'Descanso Corto',
    icon: Coffee,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    ringColor: 'stroke-emerald-500',
    description: 'Toma un respiro',
  },
  longBreak: {
    label: 'Descanso Largo',
    icon: Zap,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    ringColor: 'stroke-blue-500',
    description: 'Relájate y recarga',
  },
};

function timeToSeconds(time: { hours: number; minutes: number; seconds: number }): number {
  return time.hours * 3600 + time.minutes * 60 + time.seconds;
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function PomodoroPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Timer state
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  // Settings
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);

  // Stats
  const [todayStats, setTodayStats] = useState<DailyStats>({
    date: new Date().toISOString().split('T')[0],
    focusMinutes: 0,
    sessionsCompleted: 0,
    streak: 0,
  });
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  // Audio context for generated sounds
  const audioContextRef = useRef<AudioContext | null>(null);

  // Function to play bell sound using Web Audio API
  const playBellSound = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Create bell sound with multiple harmonics
      const now = ctx.currentTime;
      const duration = 0.8;
      const volume = settings.soundVolume / 100 * 0.3;

      // Fundamental frequency
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 830; // G#5
      gain1.gain.setValueAtTime(volume, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + duration);

      // Second harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 1245; // Second tone
      gain2.gain.setValueAtTime(volume * 0.6, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + duration);

      // Third tone for richness
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.value = 1660;
      gain3.gain.setValueAtTime(volume * 0.3, now);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.6);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + duration);

      // Second bell ring (delayed)
      setTimeout(() => {
        const now2 = ctx.currentTime;
        const osc4 = ctx.createOscillator();
        const gain4 = ctx.createGain();
        osc4.type = 'sine';
        osc4.frequency.value = 830;
        gain4.gain.setValueAtTime(volume * 0.8, now2);
        gain4.gain.exponentialRampToValueAtTime(0.01, now2 + duration);
        osc4.connect(gain4);
        gain4.connect(ctx.destination);
        osc4.start(now2);
        osc4.stop(now2 + duration);
      }, 400);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [settings.soundEnabled, settings.soundVolume]);

  // Load settings and stats from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoro-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTempSettings(parsed);
      const initialTime = timeToSeconds(parsed.focus);
      setTimeLeft(initialTime);
      setTotalTime(initialTime);
    }

    const savedStats = localStorage.getItem('pomodoro-stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.date === today) {
        setTodayStats(parsed);
      }
    }

    const savedSessions = localStorage.getItem('pomodoro-sessions');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  // Update document title with timer
  useEffect(() => {
    const modeLabel = MODE_CONFIG[mode].label;
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - ${modeLabel} | CampusMind`;
    } else {
      document.title = 'Pomodoro | CampusMind';
    }

    return () => {
      document.title = 'CampusMind';
    };
  }, [timeLeft, isRunning, mode]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);

    // Play sound using Web Audio API
    playBellSound();

    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const modeConfig = MODE_CONFIG[mode];
      new Notification(`${modeConfig.label} completado!`, {
        body: mode === 'focus' ? '¡Excelente trabajo! Toma un descanso.' : '¡Descanso terminado! Hora de enfocarse.',
        icon: '/icon.png',
      });
    }

    if (mode === 'focus') {
      // Save session
      const newSession: PomodoroSession = {
        id: Date.now().toString(),
        mode: 'focus',
        duration: totalTime,
        completedAt: new Date(),
        subjectId: selectedSubjectId || undefined,
        subjectName: subjects.find(s => s.id === selectedSubjectId)?.name,
      };

      const updatedSessions = [newSession, ...sessions].slice(0, 100);
      setSessions(updatedSessions);
      localStorage.setItem('pomodoro-sessions', JSON.stringify(updatedSessions));

      // Update stats
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);

      const focusMinutes = Math.round(totalTime / 60);
      const newStats = {
        ...todayStats,
        focusMinutes: todayStats.focusMinutes + focusMinutes,
        sessionsCompleted: todayStats.sessionsCompleted + 1,
        streak: todayStats.streak + 1,
      };
      setTodayStats(newStats);
      localStorage.setItem('pomodoro-stats', JSON.stringify(newStats));

      // Switch to break
      const nextMode = newSessionsCompleted % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      // Break completed, switch to focus
      switchMode('focus');

      if (settings.autoStartFocus) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  }, [mode, settings, totalTime, selectedSubjectId, subjects, sessions, sessionsCompleted, todayStats, playBellSound]);

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const newTime = timeToSeconds(settings[newMode]);
    setTimeLeft(newTime);
    setTotalTime(newTime);
  };

  const toggleTimer = () => {
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const resetTime = timeToSeconds(settings[mode]);
    setTimeLeft(resetTime);
    setTotalTime(resetTime);
  };

  const skipTimer = () => {
    if (mode === 'focus') {
      const nextMode = (sessionsCompleted + 1) % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);
    } else {
      switchMode('focus');
    }
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem('pomodoro-settings', JSON.stringify(tempSettings));

    // Update current timer if not running
    if (!isRunning) {
      const newTime = timeToSeconds(tempSettings[mode]);
      setTimeLeft(newTime);
      setTotalTime(newTime);
    }

    setIsSettingsOpen(false);
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const modeConfig = MODE_CONFIG[mode];
  const ModeIcon = modeConfig.icon;

  const subjectOptions = [
    { value: '', label: 'Sin materia' },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className={cn(
        "relative overflow-hidden border-b border-secondary-200/50 transition-colors duration-500",
        `bg-gradient-to-r ${modeConfig.bgGradient}/80 via-white to-${modeConfig.bgGradient}/80`
      )}>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className={cn(
          "absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors duration-500",
          mode === 'focus' && 'bg-gradient-to-br from-rose-500/10 to-orange-500/10',
          mode === 'shortBreak' && 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
          mode === 'longBreak' && 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10'
        )} />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500",
                `bg-gradient-to-br ${modeConfig.gradient}`
              )}>
                <Timer className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className={cn(
                    "bg-clip-text text-transparent transition-all duration-500",
                    `bg-gradient-to-r ${modeConfig.gradient}`
                  )}>Pomodoro</span> Timer
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Técnica de productividad para estudiar mejor
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold text-secondary-900">{todayStats.streak}</span>
                </div>
                <p className="text-xs text-secondary-500">Racha</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-secondary-900">{todayStats.sessionsCompleted}</span>
                </div>
                <p className="text-xs text-secondary-500">Sesiones hoy</p>
              </div>
              <div className="w-px h-10 bg-secondary-200" />
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold text-secondary-900">{todayStats.focusMinutes}</span>
                </div>
                <p className="text-xs text-secondary-500">Minutos enfocado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Mode Selector */}
          <div className="flex justify-center gap-2 mb-8">
            {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => {
              const config = MODE_CONFIG[m];
              const Icon = config.icon;
              return (
                <button
                  key={m}
                  onClick={() => !isRunning && switchMode(m)}
                  disabled={isRunning}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                    mode === m
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                      : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50',
                    isRunning && mode !== m && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Timer Card */}
          <Card className="overflow-hidden mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {/* Circular Timer */}
                <div className="relative flex-shrink-0">
                  <svg className="w-80 h-80 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r="140"
                      strokeWidth="12"
                      fill="none"
                      className="stroke-secondary-100"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="160"
                      cy="160"
                      r="140"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      className={cn('transition-all duration-500', modeConfig.ringColor)}
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                      }}
                    />
                  </svg>

                  {/* Timer display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                      `bg-gradient-to-br ${modeConfig.gradient}`
                    )}>
                      <ModeIcon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-6xl font-bold text-secondary-900 font-mono tracking-tight">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-secondary-500 mt-2">{modeConfig.description}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex-1 flex flex-col items-center lg:items-start gap-6">
                  {/* Subject selector */}
                  <div className="w-full max-w-xs">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Estudiando
                    </label>
                    <Select
                      options={subjectOptions}
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      disabled={isRunning}
                    />
                  </div>

                  {/* Main controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resetTimer}
                      className="w-14 h-14 rounded-full p-0"
                    >
                      <RotateCcw className="h-6 w-6" />
                    </Button>

                    <button
                      onClick={toggleTimer}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
                        `bg-gradient-to-br ${modeConfig.gradient}`
                      )}
                    >
                      {isRunning ? (
                        <Pause className="h-10 w-10 text-white" />
                      ) : (
                        <Play className="h-10 w-10 text-white ml-1" />
                      )}
                    </button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={skipTimer}
                      className="w-14 h-14 rounded-full p-0"
                    >
                      <SkipForward className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Secondary controls */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                      className={cn(
                        "p-3 rounded-xl transition-colors",
                        settings.soundEnabled
                          ? 'bg-secondary-100 text-secondary-700'
                          : 'bg-secondary-50 text-secondary-400'
                      )}
                    >
                      {settings.soundEnabled ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setTempSettings(settings);
                        setIsSettingsOpen(true);
                      }}
                      className="p-3 rounded-xl bg-secondary-100 text-secondary-700 hover:bg-secondary-200 transition-colors"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Session indicator */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full transition-colors",
                          i < (sessionsCompleted % settings.longBreakInterval)
                            ? `bg-gradient-to-br ${modeConfig.gradient}`
                            : 'bg-secondary-200'
                        )}
                      />
                    ))}
                    <span className="text-sm text-secondary-500 ml-2">
                      #{sessionsCompleted + 1}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-rose-50 to-orange-50 border-rose-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-rose-600 font-medium">Sesiones hoy</p>
                    <p className="text-3xl font-bold text-secondary-900">{todayStats.sessionsCompleted}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Tiempo enfocado</p>
                    <p className="text-3xl font-bold text-secondary-900">{Math.round(todayStats.focusMinutes / 60 * 10) / 10}h</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Racha actual</p>
                    <p className="text-3xl font-bold text-secondary-900">{todayStats.streak}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary-500" />
                  Sesiones recientes
                </h3>
                <div className="space-y-3">
                  {sessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">
                            {session.subjectName || 'Sesión de enfoque'}
                          </p>
                          <p className="text-sm text-secondary-500">
                            {new Date(session.completedAt).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">
                        {Math.round(session.duration / 60)} min
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configuración del Timer"
        description="Personaliza los tiempos y opciones del Pomodoro"
        size="lg"
        variant="glass"
      >
        <div className="space-y-6">
          {/* Time Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-500" />
              Tiempos (Horas : Minutos : Segundos)
            </h4>

            {/* Focus Time */}
            <div className="p-4 bg-rose-50 rounded-xl">
              <label className="block text-sm font-medium text-rose-700 mb-3">
                Tiempo de Enfoque
              </label>
              <div className="flex items-center gap-2">
                <TimeInput
                  value={tempSettings.focus.hours}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    focus: { ...s.focus, hours: v }
                  }))}
                  max={23}
                  label="H"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.focus.minutes}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    focus: { ...s.focus, minutes: v }
                  }))}
                  max={59}
                  label="M"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.focus.seconds}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    focus: { ...s.focus, seconds: v }
                  }))}
                  max={59}
                  label="S"
                />
              </div>
            </div>

            {/* Short Break Time */}
            <div className="p-4 bg-emerald-50 rounded-xl">
              <label className="block text-sm font-medium text-emerald-700 mb-3">
                Descanso Corto
              </label>
              <div className="flex items-center gap-2">
                <TimeInput
                  value={tempSettings.shortBreak.hours}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    shortBreak: { ...s.shortBreak, hours: v }
                  }))}
                  max={23}
                  label="H"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.shortBreak.minutes}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    shortBreak: { ...s.shortBreak, minutes: v }
                  }))}
                  max={59}
                  label="M"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.shortBreak.seconds}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    shortBreak: { ...s.shortBreak, seconds: v }
                  }))}
                  max={59}
                  label="S"
                />
              </div>
            </div>

            {/* Long Break Time */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <label className="block text-sm font-medium text-blue-700 mb-3">
                Descanso Largo
              </label>
              <div className="flex items-center gap-2">
                <TimeInput
                  value={tempSettings.longBreak.hours}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    longBreak: { ...s.longBreak, hours: v }
                  }))}
                  max={23}
                  label="H"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.longBreak.minutes}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    longBreak: { ...s.longBreak, minutes: v }
                  }))}
                  max={59}
                  label="M"
                />
                <span className="text-2xl text-secondary-400">:</span>
                <TimeInput
                  value={tempSettings.longBreak.seconds}
                  onChange={(v) => setTempSettings(s => ({
                    ...s,
                    longBreak: { ...s.longBreak, seconds: v }
                  }))}
                  max={59}
                  label="S"
                />
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-secondary-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary-500" />
              Opciones
            </h4>

            <div className="p-4 bg-secondary-50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary-700">Descanso largo cada</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTempSettings(s => ({
                      ...s,
                      longBreakInterval: Math.max(1, s.longBreakInterval - 1)
                    }))}
                    className="w-8 h-8 rounded-lg bg-secondary-200 flex items-center justify-center hover:bg-secondary-300 transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{tempSettings.longBreakInterval}</span>
                  <button
                    onClick={() => setTempSettings(s => ({
                      ...s,
                      longBreakInterval: Math.min(10, s.longBreakInterval + 1)
                    }))}
                    className="w-8 h-8 rounded-lg bg-secondary-200 flex items-center justify-center hover:bg-secondary-300 transition-colors"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="text-secondary-500">sesiones</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary-700">Auto-iniciar descansos</span>
                <button
                  onClick={() => setTempSettings(s => ({ ...s, autoStartBreaks: !s.autoStartBreaks }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors",
                    tempSettings.autoStartBreaks ? 'bg-primary-500' : 'bg-secondary-300'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow transform transition-transform",
                    tempSettings.autoStartBreaks ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary-700">Auto-iniciar enfoque</span>
                <button
                  onClick={() => setTempSettings(s => ({ ...s, autoStartFocus: !s.autoStartFocus }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors",
                    tempSettings.autoStartFocus ? 'bg-primary-500' : 'bg-secondary-300'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow transform transition-transform",
                    tempSettings.autoStartFocus ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-secondary-700">Sonido habilitado</span>
                <button
                  onClick={() => setTempSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors",
                    tempSettings.soundEnabled ? 'bg-primary-500' : 'bg-secondary-300'
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow transform transition-transform",
                    tempSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  )} />
                </button>
              </div>

              {tempSettings.soundEnabled && (
                <div className="flex items-center justify-between">
                  <span className="text-secondary-700">Volumen</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={tempSettings.soundVolume}
                    onChange={(e) => setTempSettings(s => ({ ...s, soundVolume: parseInt(e.target.value) }))}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={saveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Time input component
function TimeInput({
  value,
  onChange,
  max,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => onChange(value >= max ? 0 : value + 1)}
        className="w-8 h-6 flex items-center justify-center text-secondary-400 hover:text-secondary-600 transition-colors"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value.toString().padStart(2, '0')}
        onChange={(e) => {
          const num = parseInt(e.target.value) || 0;
          onChange(Math.min(max, Math.max(0, num)));
        }}
        className="w-14 h-12 text-center text-2xl font-bold bg-white border-2 border-secondary-200 rounded-xl focus:border-primary-400 focus:outline-none"
      />
      <button
        onClick={() => onChange(value <= 0 ? max : value - 1)}
        className="w-8 h-6 flex items-center justify-center text-secondary-400 hover:text-secondary-600 transition-colors"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <span className="text-xs text-secondary-400 mt-1">{label}</span>
    </div>
  );
}
