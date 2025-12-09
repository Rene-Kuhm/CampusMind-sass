'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { notifications, NotificationPreferences } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
} from '@/components/ui';
import {
  Bell,
  Mail,
  Smartphone,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Settings,
  BellRing,
  Calendar,
  Trophy,
  Flame,
  MessageSquare,
  Megaphone,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'preferences' | 'test';

export default function NotificationsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('preferences');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      studyReminders: true,
      weeklyDigest: true,
      achievements: true,
      streakWarnings: true,
      marketing: false,
    },
    push: {
      studyReminders: true,
      achievements: true,
      streakWarnings: true,
      comments: true,
      calendarEvents: true,
    },
  });

  // Test results
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [prefs, pushStatus] = await Promise.all([
        notifications.getPreferences(token),
        notifications.getPushStatus(token),
      ]);
      setPreferences(prefs);
      setPushEnabled(pushStatus.enabled);
      setPushSubscribed(pushStatus.subscribed);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Request push permission
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones push');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Subscribe to push
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = await notifications.getVapidKey();

        if (!vapidKey.enabled) {
          alert('Las notificaciones push no están habilitadas en el servidor');
          return;
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey.publicKey,
        });

        const subJson = subscription.toJSON();
        if (token && subJson.endpoint && subJson.keys) {
          await notifications.subscribePush(token, {
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh!,
              auth: subJson.keys.auth!,
            },
          });
          setPushSubscribed(true);
        }
      } catch (error) {
        console.error('Error subscribing to push:', error);
      }
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await notifications.updatePreferences(token, preferences);
      setTestResult({ success: true, message: 'Preferencias guardadas' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      setTestResult({ success: false, message: 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  // Send test notification
  const handleTestPush = async () => {
    if (!token) return;
    try {
      const result = await notifications.sendTestPush(token);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult({ success: false, message: 'Error al enviar' });
    }
  };

  // Send test email
  const handleTestEmail = async (template: 'welcome' | 'study-reminder' | 'achievement-unlocked' | 'weekly-summary') => {
    if (!token) return;
    try {
      const result = await notifications.sendTestEmail(token, template);
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult({ success: false, message: 'Error al enviar' });
    }
  };

  const updateEmailPref = (key: keyof NotificationPreferences['email'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const updatePushPref = (key: keyof NotificationPreferences['push'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
                  Notificaciones
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">Configura tus alertas y recordatorios</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-secondary-500" />
              <span className="text-sm text-secondary-600">Push:</span>
              {pushSubscribed ? (
                <Badge variant="success">Activo</Badge>
              ) : (
                <Badge variant="secondary">Inactivo</Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'preferences', label: 'Preferencias', icon: Settings },
              { id: 'test', label: 'Probar', icon: Send },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-cyan-600"
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
        <div className="max-w-3xl mx-auto">
          {/* Result Toast */}
          {testResult && (
            <div className={cn(
              "fixed top-4 right-4 p-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-top",
              testResult.success ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}>
              {testResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {testResult.message}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Push Notifications */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">Notificaciones Push</h3>
                        <p className="text-sm text-secondary-500">Alertas en tiempo real en tu dispositivo</p>
                      </div>
                    </div>
                    {!pushSubscribed && (
                      <Button variant="gradient" size="sm" onClick={requestPushPermission}>
                        <BellRing className="h-4 w-4 mr-2" />
                        Activar
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'studyReminders' as const, label: 'Recordatorios de estudio', icon: Bell, desc: 'Recibe alertas para mantener tu rutina' },
                      { key: 'achievements' as const, label: 'Logros desbloqueados', icon: Trophy, desc: 'Celebra tus logros al instante' },
                      { key: 'streakWarnings' as const, label: 'Alertas de racha', icon: Flame, desc: 'No pierdas tu racha de estudio' },
                      { key: 'comments' as const, label: 'Comentarios', icon: MessageSquare, desc: 'Respuestas en foros y grupos' },
                      { key: 'calendarEvents' as const, label: 'Eventos del calendario', icon: Calendar, desc: 'Recordatorios de exámenes y entregas' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-secondary-400" />
                          <div>
                            <p className="font-medium text-secondary-900">{item.label}</p>
                            <p className="text-sm text-secondary-500">{item.desc}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.push[item.key]}
                          onChange={(e) => updatePushPref(item.key, e.target.checked)}
                          className="w-5 h-5 rounded border-secondary-300 text-cyan-500 focus:ring-cyan-500"
                        />
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Notifications */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">Notificaciones por Email</h3>
                      <p className="text-sm text-secondary-500">Resúmenes y recordatorios en tu correo</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'studyReminders' as const, label: 'Recordatorios de estudio', icon: Bell, desc: 'Emails diarios para mantener tu rutina' },
                      { key: 'weeklyDigest' as const, label: 'Resumen semanal', icon: Calendar, desc: 'Estadísticas y progreso de la semana' },
                      { key: 'achievements' as const, label: 'Logros desbloqueados', icon: Trophy, desc: 'Notificación cuando desbloqueas logros' },
                      { key: 'streakWarnings' as const, label: 'Alertas de racha', icon: Flame, desc: 'Aviso antes de perder tu racha' },
                      { key: 'marketing' as const, label: 'Novedades y ofertas', icon: Megaphone, desc: 'Nuevas funciones y promociones' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-secondary-400" />
                          <div>
                            <p className="font-medium text-secondary-900">{item.label}</p>
                            <p className="text-sm text-secondary-500">{item.desc}</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.email[item.key]}
                          onChange={(e) => updateEmailPref(item.key, e.target.checked)}
                          className="w-5 h-5 rounded border-secondary-300 text-purple-500 focus:ring-purple-500"
                        />
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button variant="gradient" onClick={handleSavePreferences} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Guardar preferencias
                </Button>
              </div>
            </div>
          )}

          {/* Test Tab */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              {/* Test Push */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">Probar Push</h3>
                      <p className="text-sm text-secondary-500">Envía una notificación de prueba a tu dispositivo</p>
                    </div>
                  </div>

                  {!pushSubscribed ? (
                    <div className="p-4 bg-amber-50 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700">Push no activado</p>
                        <p className="text-sm text-amber-600">Activa las notificaciones push primero en la pestaña de preferencias</p>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={handleTestPush}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar notificación de prueba
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Test Emails */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900">Probar Emails</h3>
                      <p className="text-sm text-secondary-500">Envía emails de prueba a tu correo</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleTestEmail('welcome')}>
                      <Mail className="h-4 w-4 mr-2" />
                      Bienvenida
                    </Button>
                    <Button variant="outline" onClick={() => handleTestEmail('study-reminder')}>
                      <Bell className="h-4 w-4 mr-2" />
                      Recordatorio
                    </Button>
                    <Button variant="outline" onClick={() => handleTestEmail('achievement-unlocked')}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Logro
                    </Button>
                    <Button variant="outline" onClick={() => handleTestEmail('weekly-summary')}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Resumen semanal
                    </Button>
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
