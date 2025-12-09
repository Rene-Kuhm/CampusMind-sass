'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { integrations, Integration } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
} from '@/components/ui';
import {
  Puzzle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Loader2,
  Settings,
  Trash2,
  Link2,
  Unlink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Integration definitions with icons and colors
const INTEGRATION_CONFIGS = {
  NOTION: {
    name: 'Notion',
    description: 'Sincroniza tus notas y documentos con Notion',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM2.332 1.155l13.215-.934c1.62-.14 2.055-.047 3.082.7L21.56 3.13c.7.514.933.653.933 1.213v16.69c0 1.027-.373 1.634-1.68 1.727l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.307-.793-1.96V2.88c0-.84.374-1.54 1.821-1.727z"/>
      </svg>
    ),
    color: 'from-gray-800 to-gray-900',
    bgColor: 'bg-gray-50',
    features: ['Sincronizar notas', 'Exportar apuntes', 'Importar páginas'],
  },
  GOOGLE_DRIVE: {
    name: 'Google Drive',
    description: 'Guarda y accede a tus archivos desde Drive',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: 'from-blue-500 to-green-500',
    bgColor: 'bg-blue-50',
    features: ['Guardar documentos', 'Sincronizar archivos', 'Compartir recursos'],
  },
  DISCORD: {
    name: 'Discord',
    description: 'Recibe notificaciones y conecta con tu comunidad',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    features: ['Notificaciones', 'Recordatorios', 'Comandos bot'],
  },
  SPOTIFY: {
    name: 'Spotify',
    description: 'Escucha música mientras estudias',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#1DB954">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    features: ['Playlists de estudio', 'Música de concentración', 'Control desde la app'],
  },
  GITHUB: {
    name: 'GitHub',
    description: 'Conecta tus repositorios y proyectos',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    color: 'from-gray-700 to-gray-900',
    bgColor: 'bg-gray-50',
    features: ['Proyectos', 'Código fuente', 'Colaboración'],
  },
  SLACK: {
    name: 'Slack',
    description: 'Integra con tu espacio de trabajo de Slack',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
        <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
        <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
        <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
      </svg>
    ),
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    features: ['Mensajes', 'Notificaciones', 'Canales'],
  },
};

type IntegrationType = keyof typeof INTEGRATION_CONFIGS;

export default function IntegrationsPage() {
  const { token } = useAuth();
  const [userIntegrations, setUserIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingType, setConnectingType] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load user integrations
  const loadIntegrations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await integrations.list(token);
      setUserIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Connect integration
  const handleConnect = async (type: IntegrationType) => {
    if (!token) return;
    setConnectingType(type);
    try {
      const authUrl = await integrations.connect(token, type);
      // In production, redirect to OAuth flow
      window.open(authUrl, '_blank', 'width=600,height=700');
      // Poll for connection status or use callback
      setTimeout(loadIntegrations, 3000);
    } catch (error) {
      console.error('Error connecting integration:', error);
    } finally {
      setConnectingType(null);
    }
  };

  // Disconnect integration
  const handleDisconnect = async (id: string) => {
    if (!token) return;
    try {
      await integrations.disconnect(token, id);
      setUserIntegrations(prev => prev.filter(i => i.id !== id));
      setSelectedIntegration(null);
      setIsSettingsModalOpen(false);
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  // Sync integration
  const handleSync = async (id: string) => {
    if (!token) return;
    try {
      await integrations.sync(token, id);
      loadIntegrations();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const getIntegrationByType = (type: string) => {
    return userIntegrations.find(i => i.type === type);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Puzzle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                  Integraciones
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">
                Conecta tus aplicaciones favoritas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(INTEGRATION_CONFIGS) as IntegrationType[]).map(type => {
                const config = INTEGRATION_CONFIGS[type];
                const userIntegration = getIntegrationByType(type);
                const isConnected = !!userIntegration;
                const isConnecting = connectingType === type;

                return (
                  <Card
                    key={type}
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isConnected ? "ring-2 ring-emerald-500/50" : "hover:shadow-lg"
                    )}
                  >
                    <div className={cn("h-2 bg-gradient-to-r", config.color)} />
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                          config.bgColor
                        )}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-secondary-900">{config.name}</h3>
                            {isConnected ? (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Conectado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                No conectado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-secondary-500 mb-3">{config.description}</p>

                          {/* Features */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {config.features.map((feature, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {isConnected ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSync(userIntegration.id)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Sincronizar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedIntegration(userIntegration);
                                    setIsSettingsModalOpen(true);
                                  }}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => handleConnect(type)}
                                disabled={isConnecting}
                              >
                                {isConnecting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Conectando...
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="h-4 w-4 mr-1" />
                                    Conectar
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Info Card */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Puzzle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 mb-2">
                    Potencia tu productividad
                  </h3>
                  <p className="text-secondary-600 text-sm">
                    Las integraciones te permiten conectar CampusMind con las herramientas que ya usas.
                    Sincroniza tus notas con Notion, guarda archivos en Google Drive, recibe notificaciones
                    en Discord y escucha música en Spotify mientras estudias.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={`Configuración de ${selectedIntegration ? INTEGRATION_CONFIGS[selectedIntegration.type as IntegrationType]?.name : ''}`}
        variant="glass"
        size="md"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-secondary-900">Conectado</p>
                  <p className="text-sm text-secondary-500">
                    Conectado el {new Date(selectedIntegration.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {selectedIntegration.lastSyncAt && (
              <div className="p-4 bg-secondary-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-secondary-900">Última sincronización</p>
                    <p className="text-sm text-secondary-500">
                      {new Date(selectedIntegration.lastSyncAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-secondary-200">
              <Button
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50"
                onClick={() => handleDisconnect(selectedIntegration.id)}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Desconectar integración
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
