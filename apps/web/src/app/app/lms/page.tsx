'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { lms, LmsConnection, LmsCourse } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  GraduationCap,
  Link2,
  Unlink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  BookOpen,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  Settings,
  Download,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// LMS Platform configurations
const LMS_PLATFORMS = {
  MOODLE: {
    name: 'Moodle',
    description: 'Conecta con tu plataforma Moodle institucional',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#F98012">
        <path d="M12.003 0C5.378 0 0 5.377 0 12s5.378 12 12.003 12c6.624 0 11.997-5.377 11.997-12S18.627 0 12.003 0zm-.282 3.654c1.77 0 3.206 1.437 3.206 3.207 0 1.77-1.436 3.206-3.206 3.206-1.77 0-3.207-1.436-3.207-3.206 0-1.77 1.437-3.207 3.207-3.207zm-4.632 5.81c1.363 0 2.468 1.106 2.468 2.469 0 1.363-1.105 2.468-2.468 2.468-1.363 0-2.469-1.105-2.469-2.468 0-1.363 1.106-2.469 2.469-2.469zm9.264 0c1.362 0 2.468 1.106 2.468 2.469 0 1.363-1.106 2.468-2.468 2.468-1.363 0-2.469-1.105-2.469-2.468 0-1.363 1.106-2.469 2.469-2.469zm-4.632 4.536c2.037 0 3.688 1.652 3.688 3.69 0 2.036-1.651 3.687-3.688 3.687-2.037 0-3.688-1.651-3.688-3.687 0-2.038 1.651-3.69 3.688-3.69z"/>
      </svg>
    ),
    requiresUrl: true,
  },
  GOOGLE_CLASSROOM: {
    name: 'Google Classroom',
    description: 'Sincroniza con tus clases de Google Classroom',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#0F9D58" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c1.66 0 3.22-.45 4.56-1.24l-1.68-2.9c-.82.41-1.76.64-2.88.64-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6c0 1.12-.23 2.06-.64 2.88l2.9 1.68C20.55 15.22 21 13.66 21 12c0-4.97-4.03-9-9-9z"/>
        <path fill="#4285F4" d="M12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
      </svg>
    ),
    requiresUrl: false,
  },
  CANVAS: {
    name: 'Canvas LMS',
    description: 'Integra con Canvas LMS de tu institución',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#E72429">
        <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.311l8.213 4.689L12 11.689 3.787 7 12 2.311zM3 8.689l8 4.571V20.4L3 15.829V8.689zm10 11.711v-7.14l8-4.571v7.14L13 20.4z"/>
      </svg>
    ),
    requiresUrl: true,
  },
};

type LmsPlatform = keyof typeof LMS_PLATFORMS;

export default function LmsPage() {
  const { token } = useAuth();
  const [connections, setConnections] = useState<LmsConnection[]>([]);
  const [courses, setCourses] = useState<LmsCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<LmsPlatform | null>(null);
  const [connectForm, setConnectForm] = useState({
    instanceUrl: '',
    apiToken: '',
  });

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await lms.getConnections(token);
      setConnections(data);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load courses
  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await lms.getCourses(token);
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }, [token]);

  useEffect(() => {
    loadConnections();
    loadCourses();
  }, [loadConnections, loadCourses]);

  // Connect to platform
  const handleConnect = async () => {
    if (!token || !selectedPlatform) return;
    setIsConnecting(true);
    try {
      const platform = LMS_PLATFORMS[selectedPlatform];
      if (platform.requiresUrl) {
        await lms.connect(token, {
          platform: selectedPlatform,
          instanceUrl: connectForm.instanceUrl,
          apiToken: connectForm.apiToken,
        });
      } else {
        // OAuth flow for Google Classroom
        const authUrl = await lms.getAuthUrl(token, selectedPlatform);
        window.open(authUrl, '_blank', 'width=600,height=700');
      }
      setIsConnectModalOpen(false);
      setConnectForm({ instanceUrl: '', apiToken: '' });
      setTimeout(() => {
        loadConnections();
        loadCourses();
      }, 2000);
    } catch (error) {
      console.error('Error connecting:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async (id: string) => {
    if (!token) return;
    try {
      await lms.disconnect(token, id);
      setConnections(prev => prev.filter(c => c.id !== id));
      loadCourses();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Sync courses
  const handleSync = async () => {
    if (!token) return;
    setIsSyncing(true);
    try {
      await lms.syncCourses(token);
      loadCourses();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Import assignments
  const handleImportAssignments = async (courseId: string) => {
    if (!token) return;
    try {
      await lms.importAssignments(token, courseId);
      alert('Tareas importadas correctamente');
    } catch (error) {
      console.error('Error importing:', error);
    }
  };

  const getConnectionByPlatform = (platform: string) => {
    return connections.find(c => c.platform === platform);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-cyan-500">
                    Integración LMS
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Conecta con Moodle, Google Classroom o Canvas
                </p>
              </div>
            </div>

            {connections.length > 0 && (
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
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Platform Connections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(LMS_PLATFORMS) as LmsPlatform[]).map(platform => {
              const config = LMS_PLATFORMS[platform];
              const connection = getConnectionByPlatform(platform);
              const isConnected = !!connection;

              return (
                <Card
                  key={platform}
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isConnected ? "ring-2 ring-emerald-500/50" : "hover:shadow-lg"
                  )}
                >
                  <div className={cn("h-2 bg-gradient-to-r", config.color)} />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        config.bgColor
                      )}>
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{config.name}</h3>
                        {isConnected ? (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Conectado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            No conectado
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-secondary-500 mb-4">{config.description}</p>

                    {isConnected ? (
                      <div className="space-y-2">
                        <div className="text-xs text-secondary-400">
                          Última sincronización: {connection.lastSyncAt
                            ? new Date(connection.lastSyncAt).toLocaleString()
                            : 'Nunca'}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-red-600 hover:bg-red-50"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Desconectar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="gradient"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedPlatform(platform);
                          setIsConnectModalOpen(true);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Conectar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Connected Courses */}
          {courses.length > 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-teal-500" />
                    Cursos Sincronizados
                  </h3>
                  <Badge variant="secondary">{courses.length} cursos</Badge>
                </div>
                <div className="space-y-3">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{course.name}</p>
                          <div className="flex items-center gap-3 text-sm text-secondary-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.instructor}
                            </span>
                            {course.pendingAssignments > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <FileText className="h-3 w-3" />
                                {course.pendingAssignments} pendientes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleImportAssignments(course.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Importar Tareas
                        </Button>
                        {course.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(course.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : connections.length > 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                <h3 className="font-semibold text-secondary-900 mb-2">Sin cursos sincronizados</h3>
                <p className="text-secondary-500 mb-4">
                  Sincroniza tu LMS para ver tus cursos aquí
                </p>
                <Button variant="gradient" onClick={handleSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Ahora
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    ¿Qué puedes hacer con la integración LMS?
                  </h3>
                  <ul className="space-y-2 text-sm text-secondary-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Sincronizar automáticamente tus cursos y materias
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Importar tareas y fechas de entrega a tu calendario
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Ver avisos y notificaciones de tus clases
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Acceder rápidamente a recursos y materiales
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => {
          setIsConnectModalOpen(false);
          setSelectedPlatform(null);
          setConnectForm({ instanceUrl: '', apiToken: '' });
        }}
        title={`Conectar ${selectedPlatform ? LMS_PLATFORMS[selectedPlatform].name : ''}`}
        variant="glass"
        size="md"
      >
        {selectedPlatform && (
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-xl border",
              LMS_PLATFORMS[selectedPlatform].bgColor
            )}>
              <div className="flex items-center gap-3">
                {LMS_PLATFORMS[selectedPlatform].icon}
                <div>
                  <p className="font-medium text-secondary-900">
                    {LMS_PLATFORMS[selectedPlatform].name}
                  </p>
                  <p className="text-sm text-secondary-500">
                    {LMS_PLATFORMS[selectedPlatform].description}
                  </p>
                </div>
              </div>
            </div>

            {LMS_PLATFORMS[selectedPlatform].requiresUrl ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    URL de tu institución *
                  </label>
                  <Input
                    placeholder="https://moodle.tuuniversidad.edu"
                    value={connectForm.instanceUrl}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, instanceUrl: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Token de API (opcional)
                  </label>
                  <Input
                    type="password"
                    placeholder="Tu token de acceso"
                    value={connectForm.apiToken}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, apiToken: e.target.value }))}
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Puedes obtenerlo en las preferencias de tu perfil de Moodle
                  </p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  Se abrirá una ventana para iniciar sesión con tu cuenta de Google.
                  Asegúrate de usar la cuenta asociada a tu institución educativa.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConnectModalOpen(false);
                  setSelectedPlatform(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleConnect}
                disabled={isConnecting || (LMS_PLATFORMS[selectedPlatform].requiresUrl && !connectForm.instanceUrl)}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Conectar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
