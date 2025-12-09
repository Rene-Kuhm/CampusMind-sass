'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { calendarSync, CalendarSyncConfig, ExternalCalendar } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
} from '@/components/ui';
import {
  Calendar,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Settings,
  Clock,
  CalendarDays,
  CalendarCheck,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarSyncPage() {
  const { token } = useAuth();
  const [config, setConfig] = useState<CalendarSyncConfig | null>(null);
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    enabled: true,
    syncDirection: 'BOTH' as 'IMPORT' | 'EXPORT' | 'BOTH',
    selectedCalendarId: '',
    syncTasks: true,
    syncStudySessions: true,
    syncExams: true,
    syncEvents: true,
    reminderMinutes: 30,
  });

  // Load config
  const loadConfig = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await calendarSync.getConfig(token);
      setConfig(data);
      if (data) {
        setFormData({
          enabled: data.enabled,
          syncDirection: data.syncDirection,
          selectedCalendarId: data.selectedCalendarId || '',
          syncTasks: data.syncTasks,
          syncStudySessions: data.syncStudySessions,
          syncExams: data.syncExams,
          syncEvents: data.syncEvents,
          reminderMinutes: data.reminderMinutes || 30,
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load calendars
  const loadCalendars = useCallback(async () => {
    if (!token) return;
    try {
      const data = await calendarSync.getCalendars(token);
      setCalendars(data);
    } catch (error) {
      console.error('Error loading calendars:', error);
    }
  }, [token]);

  useEffect(() => {
    loadConfig();
    loadCalendars();
  }, [loadConfig, loadCalendars]);

  // Connect Google Calendar
  const handleConnect = async () => {
    if (!token) return;
    setIsConnecting(true);
    try {
      const authUrl = await calendarSync.connect(token);
      window.open(authUrl, '_blank', 'width=600,height=700');
      // Poll for connection
      setTimeout(() => {
        loadConfig();
        loadCalendars();
      }, 3000);
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!token) return;
    try {
      await calendarSync.disconnect(token);
      setConfig(null);
      setCalendars([]);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Sync now
  const handleSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      await calendarSync.sync(token);
      alert('Sincronización completada');
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save config
  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      const updated = await calendarSync.updateConfig(token, formData);
      setConfig(updated);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'IMPORT':
        return <ArrowLeft className="h-4 w-4" />;
      case 'EXPORT':
        return <ArrowRight className="h-4 w-4" />;
      case 'BOTH':
        return (
          <div className="flex items-center">
            <ArrowLeft className="h-4 w-4" />
            <ArrowRight className="h-4 w-4 -ml-1" />
          </div>
        );
      default:
        return null;
    }
  };

  const syncOptions = [
    {
      key: 'syncTasks',
      label: 'Tareas',
      description: 'Sincronizar fechas de entrega',
      icon: CalendarCheck,
      color: 'text-blue-500',
    },
    {
      key: 'syncStudySessions',
      label: 'Sesiones de Estudio',
      description: 'Bloquear tiempo de estudio',
      icon: Clock,
      color: 'text-violet-500',
    },
    {
      key: 'syncExams',
      label: 'Exámenes',
      description: 'Fechas de exámenes y pruebas',
      icon: CalendarDays,
      color: 'text-red-500',
    },
    {
      key: 'syncEvents',
      label: 'Eventos',
      description: 'Clases y eventos académicos',
      icon: Calendar,
      color: 'text-emerald-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const isConnected = config?.connected;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center shadow-lg">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-sky-500">
                    Sincronización de Calendario
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Conecta con Google Calendar
                </p>
              </div>
            </div>

            {isConnected && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Connection Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    isConnected ? "bg-emerald-100" : "bg-secondary-100"
                  )}>
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">Google Calendar</h3>
                    {isConnected ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                        {config?.lastSyncAt && (
                          <span className="text-sm text-secondary-500">
                            Última sync: {new Date(config.lastSyncAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        No conectado
                      </Badge>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={handleDisconnect}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    variant="gradient"
                    onClick={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Conectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {isConnected && (
            <>
              {/* Sync Direction */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-500" />
                    Configuración de Sincronización
                  </h3>

                  <div className="space-y-4">
                    {/* Calendar Selection */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Calendario a sincronizar
                      </label>
                      <Select
                        value={formData.selectedCalendarId}
                        onChange={(e) => setFormData(prev => ({ ...prev, selectedCalendarId: e.target.value }))}
                        options={[
                          { value: '', label: 'Seleccionar calendario' },
                          ...calendars.map(c => ({ value: c.id, label: c.name })),
                        ]}
                      />
                    </div>

                    {/* Sync Direction */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Dirección de sincronización
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'IMPORT', label: 'Solo importar', desc: 'Google → CampusMind' },
                          { value: 'EXPORT', label: 'Solo exportar', desc: 'CampusMind → Google' },
                          { value: 'BOTH', label: 'Bidireccional', desc: 'Ambas direcciones' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              syncDirection: option.value as typeof formData.syncDirection
                            }))}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              formData.syncDirection === option.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-secondary-200 hover:border-secondary-300"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getSyncDirectionIcon(option.value)}
                              <span className="font-medium text-secondary-900">{option.label}</span>
                            </div>
                            <p className="text-xs text-secondary-500">{option.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reminder */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Recordatorio antes del evento
                      </label>
                      <Select
                        value={formData.reminderMinutes.toString()}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reminderMinutes: parseInt(e.target.value)
                        }))}
                        options={[
                          { value: '0', label: 'Sin recordatorio' },
                          { value: '5', label: '5 minutos antes' },
                          { value: '15', label: '15 minutos antes' },
                          { value: '30', label: '30 minutos antes' },
                          { value: '60', label: '1 hora antes' },
                          { value: '1440', label: '1 día antes' },
                        ]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What to Sync */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-blue-500" />
                    Elementos a Sincronizar
                  </h3>
                  <div className="space-y-3">
                    {syncOptions.map(option => {
                      const Icon = option.icon;
                      const isEnabled = formData[option.key as keyof typeof formData] as boolean;

                      return (
                        <div
                          key={option.key}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                            isEnabled
                              ? "bg-white border-secondary-200 hover:border-blue-300"
                              : "bg-secondary-50 border-secondary-100"
                          )}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            [option.key]: !prev[option.key as keyof typeof prev]
                          }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isEnabled ? "bg-blue-100" : "bg-secondary-100"
                            )}>
                              <Icon className={cn("h-5 w-5", isEnabled ? option.color : "text-secondary-400")} />
                            </div>
                            <div>
                              <p className={cn(
                                "font-medium",
                                isEnabled ? "text-secondary-900" : "text-secondary-500"
                              )}>
                                {option.label}
                              </p>
                              <p className="text-sm text-secondary-500">{option.description}</p>
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
            </>
          )}

          {/* Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-sky-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    Beneficios de la sincronización
                  </h3>
                  <ul className="space-y-2 text-sm text-secondary-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Ve todas tus tareas y exámenes en Google Calendar
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Importa eventos de tu calendario a CampusMind
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Recibe recordatorios en tu teléfono
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Mantén todo sincronizado automáticamente
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
