'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { wellness, WellnessLog, BreakReminder, WellnessTip } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
} from '@/components/ui';
import {
  Heart,
  Moon,
  Smile,
  Frown,
  Meh,
  Zap,
  Coffee,
  Brain,
  Timer,
  Bell,
  BellOff,
  TrendingUp,
  Calendar,
  Loader2,
  Save,
  Lightbulb,
  Activity,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WellnessPage() {
  const { token } = useAuth();
  const [todayLog, setTodayLog] = useState<WellnessLog | null>(null);
  const [breakReminder, setBreakReminder] = useState<BreakReminder | null>(null);
  const [dailyTip, setDailyTip] = useState<WellnessTip | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

  // Form state for today's log
  const [logForm, setLogForm] = useState({
    sleepHours: '',
    sleepQuality: 3,
    moodScore: 3,
    stressLevel: 3,
    energyLevel: 3,
    exerciseMinutes: '',
    meditationMinutes: '',
    notes: '',
    gratitude: ['', '', ''],
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [log, reminder, tip, statsData] = await Promise.all([
        wellness.getLog(token, today).catch(() => null),
        wellness.getBreakReminder(token).catch(() => null),
        wellness.getDailyTip(token).catch(() => null),
        wellness.getStats(token, 'week').catch(() => null),
      ]);

      if (log) {
        setTodayLog(log);
        setLogForm({
          sleepHours: log.sleepHours?.toString() || '',
          sleepQuality: log.sleepQuality || 3,
          moodScore: log.moodScore || 3,
          stressLevel: log.stressLevel || 3,
          energyLevel: log.energyLevel || 3,
          exerciseMinutes: log.exerciseMinutes?.toString() || '',
          meditationMinutes: log.meditationMinutes?.toString() || '',
          notes: log.notes || '',
          gratitude: log.gratitude?.length >= 3 ? log.gratitude : ['', '', ''],
        });
      }
      setBreakReminder(reminder);
      setDailyTip(tip);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save log
  const handleSaveLog = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const data: Partial<WellnessLog> = {
        date: new Date().toISOString().split('T')[0],
        sleepHours: logForm.sleepHours ? parseFloat(logForm.sleepHours) : undefined,
        sleepQuality: logForm.sleepQuality,
        moodScore: logForm.moodScore,
        stressLevel: logForm.stressLevel,
        energyLevel: logForm.energyLevel,
        exerciseMinutes: logForm.exerciseMinutes ? parseInt(logForm.exerciseMinutes) : undefined,
        meditationMinutes: logForm.meditationMinutes ? parseInt(logForm.meditationMinutes) : undefined,
        notes: logForm.notes || undefined,
        gratitude: logForm.gratitude.filter(g => g.trim()),
      };

      if (todayLog) {
        await wellness.updateLog(token, data.date!, data);
      } else {
        await wellness.createLog(token, data);
      }
      loadData();
    } catch (error) {
      console.error('Error saving log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Update break reminder
  const handleUpdateBreakReminder = async (data: Partial<BreakReminder>) => {
    if (!token) return;
    try {
      const updated = await wellness.updateBreakReminder(token, data);
      setBreakReminder(updated);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile className="h-6 w-6 text-emerald-500" />;
    if (score >= 3) return <Meh className="h-6 w-6 text-amber-500" />;
    return <Frown className="h-6 w-6 text-red-500" />;
  };

  const getScoreColor = (score: number, inverse = false) => {
    const adjusted = inverse ? 6 - score : score;
    if (adjusted >= 4) return 'bg-emerald-500';
    if (adjusted >= 3) return 'bg-amber-500';
    return 'bg-red-500';
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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-pink-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                    Bienestar
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Cuida tu salud mental y física</p>
              </div>
            </div>
            <Button variant="gradient" onClick={handleSaveLog} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Día
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Daily Tip */}
          {dailyTip && (
            <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{dailyTip.title}</h3>
                    <p className="text-sm text-secondary-600 mt-1">{dailyTip.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Moon className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-secondary-900">{stats.averageSleep?.toFixed(1) || '-'}h</p>
                  <p className="text-xs text-secondary-500">Promedio sueño</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Smile className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-secondary-900">{stats.averageMood?.toFixed(1) || '-'}/5</p>
                  <p className="text-xs text-secondary-500">Estado de ánimo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Activity className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalExerciseMinutes || 0}</p>
                  <p className="text-xs text-secondary-500">Min ejercicio</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Sparkles className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-secondary-900">{stats.streak || 0}</p>
                  <p className="text-xs text-secondary-500">Días racha</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Check-in */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-500" />
                  Check-in de Hoy
                </h3>

                <div className="space-y-6">
                  {/* Sleep */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Horas de sueño
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="7.5"
                      value={logForm.sleepHours}
                      onChange={(e) => setLogForm(prev => ({ ...prev, sleepHours: e.target.value }))}
                    />
                    <div className="mt-2">
                      <p className="text-xs text-secondary-500 mb-1">Calidad del sueño</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setLogForm(prev => ({ ...prev, sleepQuality: n }))}
                            className={cn(
                              "flex-1 h-8 rounded transition-colors",
                              logForm.sleepQuality >= n ? 'bg-indigo-500' : 'bg-secondary-200'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                      {getMoodIcon(logForm.moodScore)}
                      Estado de ánimo
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setLogForm(prev => ({ ...prev, moodScore: n }))}
                          className={cn(
                            "flex-1 h-10 rounded transition-colors",
                            logForm.moodScore >= n ? getScoreColor(n) : 'bg-secondary-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Stress */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                      <Brain className="h-4 w-4 text-rose-500" />
                      Nivel de estrés (1=bajo, 5=alto)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setLogForm(prev => ({ ...prev, stressLevel: n }))}
                          className={cn(
                            "flex-1 h-10 rounded transition-colors",
                            logForm.stressLevel >= n ? getScoreColor(n, true) : 'bg-secondary-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Energy */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      Nivel de energía
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setLogForm(prev => ({ ...prev, energyLevel: n }))}
                          className={cn(
                            "flex-1 h-10 rounded transition-colors",
                            logForm.energyLevel >= n ? 'bg-amber-500' : 'bg-secondary-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Exercise & Meditation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Ejercicio (min)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="30"
                        value={logForm.exerciseMinutes}
                        onChange={(e) => setLogForm(prev => ({ ...prev, exerciseMinutes: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 mb-2">
                        <Coffee className="h-4 w-4 text-purple-500" />
                        Meditación (min)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="10"
                        value={logForm.meditationMinutes}
                        onChange={(e) => setLogForm(prev => ({ ...prev, meditationMinutes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gratitude & Break Reminders */}
            <div className="space-y-6">
              {/* Gratitude */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    3 cosas por las que estoy agradecido
                  </h3>
                  <div className="space-y-3">
                    {[0, 1, 2].map(idx => (
                      <Input
                        key={idx}
                        placeholder={`${idx + 1}. Algo positivo de hoy...`}
                        value={logForm.gratitude[idx]}
                        onChange={(e) => {
                          const newGratitude = [...logForm.gratitude];
                          newGratitude[idx] = e.target.value;
                          setLogForm(prev => ({ ...prev, gratitude: newGratitude }));
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Break Reminders */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                      <Timer className="h-5 w-5 text-blue-500" />
                      Recordatorios de Descanso
                    </h3>
                    <button
                      onClick={() => breakReminder && handleUpdateBreakReminder({ isEnabled: !breakReminder.isEnabled })}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        breakReminder?.isEnabled ? 'bg-blue-500' : 'bg-secondary-200'
                      )}
                    >
                      <span className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        breakReminder?.isEnabled ? 'translate-x-7' : 'translate-x-1'
                      )} />
                    </button>
                  </div>

                  {breakReminder?.isEnabled && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <span className="font-medium text-blue-700">Técnica 52-17</span>
                      </div>
                      <p className="text-sm text-blue-600">
                        Estudia {breakReminder.intervalMinutes} minutos, descansa {breakReminder.breakMinutes} minutos.
                      </p>
                      <p className="text-xs text-blue-500 mt-2">
                        Activo de {breakReminder.startTime} a {breakReminder.endTime}
                      </p>
                    </div>
                  )}

                  {!breakReminder?.isEnabled && (
                    <p className="text-sm text-secondary-500">
                      Activa los recordatorios para mejorar tu concentración y evitar el burnout.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Notas del día</h3>
                  <textarea
                    className="w-full h-24 p-3 border border-secondary-200 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="¿Cómo fue tu día? ¿Qué aprendiste?"
                    value={logForm.notes}
                    onChange={(e) => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
