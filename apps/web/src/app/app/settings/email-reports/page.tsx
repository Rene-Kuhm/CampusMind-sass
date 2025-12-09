'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { emailReports, EmailReportConfig } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import {
  Mail,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Send,
  BarChart3,
  BookOpen,
  Target,
  Trophy,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmailReportsPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<EmailReportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    enabled: true,
    frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY',
    dayOfWeek: 1, // Monday
    timeOfDay: '09:00',
    includeStudyStats: true,
    includeTaskSummary: true,
    includeGoalProgress: true,
    includeUpcomingDeadlines: true,
    includeAchievements: true,
    includeRecommendations: true,
  });

  // Load config
  const loadConfig = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await emailReports.getConfig(token);
      setConfig(data);
      if (data) {
        setFormData({
          enabled: data.enabled,
          frequency: data.frequency,
          dayOfWeek: data.dayOfWeek || 1,
          timeOfDay: data.timeOfDay || '09:00',
          includeStudyStats: data.includeStudyStats ?? true,
          includeTaskSummary: data.includeTaskSummary ?? true,
          includeGoalProgress: data.includeGoalProgress ?? true,
          includeUpcomingDeadlines: data.includeUpcomingDeadlines ?? true,
          includeAchievements: data.includeAchievements ?? true,
          includeRecommendations: data.includeRecommendations ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Save config
  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await emailReports.updateConfig(token, formData);
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Send test email
  const handleSendTest = async () => {
    if (!token) return;
    setIsSendingTest(true);
    try {
      await emailReports.sendTest(token);
      alert('Email de prueba enviado correctamente');
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Error al enviar el email de prueba');
    } finally {
      setIsSendingTest(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  const getFrequencyLabel = (freq: string) => {
    const labels: Record<string, string> = {
      DAILY: 'Diario',
      WEEKLY: 'Semanal',
      MONTHLY: 'Mensual',
    };
    return labels[freq] || freq;
  };

  const reportSections = [
    {
      key: 'includeStudyStats',
      label: 'Estadísticas de Estudio',
      description: 'Horas estudiadas, sesiones completadas y materias',
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      key: 'includeTaskSummary',
      label: 'Resumen de Tareas',
      description: 'Tareas completadas, pendientes y próximas',
      icon: FileText,
      color: 'text-emerald-500',
    },
    {
      key: 'includeGoalProgress',
      label: 'Progreso de Metas',
      description: 'Avance en tus metas académicas',
      icon: Target,
      color: 'text-violet-500',
    },
    {
      key: 'includeUpcomingDeadlines',
      label: 'Próximas Fechas',
      description: 'Entregas y exámenes próximos',
      icon: Calendar,
      color: 'text-orange-500',
    },
    {
      key: 'includeAchievements',
      label: 'Logros',
      description: 'Badges y logros desbloqueados',
      icon: Trophy,
      color: 'text-amber-500',
    },
    {
      key: 'includeRecommendations',
      label: 'Recomendaciones IA',
      description: 'Sugerencias personalizadas para mejorar',
      icon: BookOpen,
      color: 'text-pink-500',
    },
  ];

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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                    Reportes por Email
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Recibe resúmenes de tu progreso académico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSendTest}
                disabled={isSendingTest}
              >
                {isSendingTest ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Prueba
              </Button>
              <Button
                variant="gradient"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saveSuccess ? 'Guardado' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Enable/Disable */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    formData.enabled ? "bg-emerald-100" : "bg-secondary-100"
                  )}>
                    {formData.enabled ? (
                      <Bell className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-secondary-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">Reportes por Email</h3>
                    <p className="text-sm text-secondary-500">
                      {formData.enabled ? 'Recibirás reportes periódicos' : 'Los reportes están desactivados'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={cn(
                    "relative w-14 h-8 rounded-full transition-colors",
                    formData.enabled ? "bg-emerald-500" : "bg-secondary-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform",
                      formData.enabled ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className={cn(!formData.enabled && "opacity-50 pointer-events-none")}>
            <CardContent className="p-6">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Programación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Frecuencia
                  </label>
                  <Select
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      frequency: e.target.value as typeof formData.frequency
                    }))}
                    options={[
                      { value: 'DAILY', label: 'Diario' },
                      { value: 'WEEKLY', label: 'Semanal' },
                      { value: 'MONTHLY', label: 'Mensual' },
                    ]}
                  />
                </div>
                {formData.frequency === 'WEEKLY' && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Día de la semana
                    </label>
                    <Select
                      value={formData.dayOfWeek.toString()}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        dayOfWeek: parseInt(e.target.value)
                      }))}
                      options={[
                        { value: '0', label: 'Domingo' },
                        { value: '1', label: 'Lunes' },
                        { value: '2', label: 'Martes' },
                        { value: '3', label: 'Miércoles' },
                        { value: '4', label: 'Jueves' },
                        { value: '5', label: 'Viernes' },
                        { value: '6', label: 'Sábado' },
                      ]}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Hora de envío
                  </label>
                  <Input
                    type="time"
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <strong>Resumen:</strong> Recibirás un email {getFrequencyLabel(formData.frequency).toLowerCase()}
                  {formData.frequency === 'WEEKLY' && ` los ${getDayName(formData.dayOfWeek).toLowerCase()}`}
                  {' '}a las {formData.timeOfDay}h.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Sections */}
          <Card className={cn(!formData.enabled && "opacity-50 pointer-events-none")}>
            <CardContent className="p-6">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Contenido del Reporte
              </h3>
              <div className="space-y-3">
                {reportSections.map(section => {
                  const Icon = section.icon;
                  const isEnabled = formData[section.key as keyof typeof formData] as boolean;

                  return (
                    <div
                      key={section.key}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                        isEnabled
                          ? "bg-white border-secondary-200 hover:border-blue-300"
                          : "bg-secondary-50 border-secondary-100"
                      )}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [section.key]: !prev[section.key as keyof typeof prev]
                      }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isEnabled ? "bg-blue-100" : "bg-secondary-100"
                        )}>
                          <Icon className={cn("h-5 w-5", isEnabled ? section.color : "text-secondary-400")} />
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium",
                            isEnabled ? "text-secondary-900" : "text-secondary-500"
                          )}>
                            {section.label}
                          </p>
                          <p className="text-sm text-secondary-500">{section.description}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        isEnabled
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white border-secondary-300"
                      )}>
                        {isEnabled && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Vista Previa del Email</h3>
              <div className="border border-secondary-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
                  <h4 className="font-bold text-lg">Tu Reporte Semanal</h4>
                  <p className="text-blue-100 text-sm">CampusMind - Semana del 2 al 8 de Diciembre</p>
                </div>
                <div className="p-4 bg-white space-y-4">
                  {formData.includeStudyStats && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-secondary-900">12 horas de estudio</p>
                        <p className="text-sm text-secondary-500">+3h vs semana anterior</p>
                      </div>
                    </div>
                  )}
                  {formData.includeTaskSummary && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="font-medium text-secondary-900">8 tareas completadas</p>
                        <p className="text-sm text-secondary-500">3 pendientes para esta semana</p>
                      </div>
                    </div>
                  )}
                  {formData.includeGoalProgress && (
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                      <Target className="h-5 w-5 text-violet-500" />
                      <div>
                        <p className="font-medium text-secondary-900">75% de tu meta semanal</p>
                        <p className="text-sm text-secondary-500">¡Vas muy bien!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
