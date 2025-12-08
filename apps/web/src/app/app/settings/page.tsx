'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui';
import { auth, rag } from '@/lib/api';
import {
  User,
  GraduationCap,
  BookOpen,
  Sparkles,
  Save,
  Settings,
  CheckCircle,
  AlertCircle,
  Globe,
  Brain,
  Layers,
  Mail,
  Building,
  Bot,
  Zap,
  Check,
} from 'lucide-react';
import {
  studyStyleLabels,
  contentDepthLabels,
  cn,
} from '@/lib/utils';

// AI Provider types
interface AIProvider {
  type: string;
  name: string;
  isFree: boolean;
  description: string;
}

interface ProvidersData {
  current: {
    type: string;
    name: string;
    isFree: boolean;
  };
  available: AIProvider[];
}

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    career: user?.profile?.career || '',
    year: user?.profile?.year?.toString() || '',
    university: user?.profile?.university || '',
    studyStyle: user?.profile?.studyStyle || 'BALANCED',
    contentDepth: user?.profile?.contentDepth || 'INTERMEDIATE',
    preferredLang: user?.profile?.preferredLang || 'es',
  });

  // AI Provider state
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [useFreeProvider, setUseFreeProvider] = useState(true);

  // Load providers on mount
  useEffect(() => {
    async function loadProviders() {
      if (!token) return;
      try {
        const data = await rag.getProviders(token);
        setProviders(data);
        setSelectedProvider(data.current.type);
      } catch (error) {
        console.error('Failed to load AI providers:', error);
      }
    }
    loadProviders();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setMessage(null);

    try {
      await auth.updateProfile(token, {
        ...profile,
        year: profile.year ? parseInt(profile.year) : null,
      });
      await refreshUser();
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsLoading(false);
    }
  }

  const yearOptions = [
    { value: '', label: 'No especificado' },
    { value: '1', label: '1er año' },
    { value: '2', label: '2do año' },
    { value: '3', label: '3er año' },
    { value: '4', label: '4to año' },
    { value: '5', label: '5to año' },
    { value: '6', label: '6to año o más' },
  ];

  const studyStyleOptions = Object.entries(studyStyleLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const contentDepthOptions = Object.entries(contentDepthLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'pt', label: 'Portugués' },
  ];

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-slate-50/80 via-white to-zinc-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-500/10 to-zinc-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-zinc-700 flex items-center justify-center shadow-lg shadow-slate-500/25">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-primary-400 to-violet-500 rounded-full border-2 border-white flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                Configuración
              </h1>
              <p className="text-secondary-500 mt-0.5">
                Personaliza tu experiencia de estudio
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success/Error Message */}
          {message && (
            <div
              className={cn(
                'p-4 rounded-xl flex items-center gap-3 animate-fade-in',
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              {message.text}
            </div>
          )}

          {/* Personal Info */}
          <Card className="overflow-hidden border-secondary-100" hover>
            <div className="h-1 bg-gradient-to-r from-primary-500 to-violet-500" />
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Información Personal</span>
                  <CardDescription className="font-normal mt-0.5">
                    Tu información básica de perfil
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary-400" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-100 bg-secondary-50 text-secondary-500 cursor-not-allowed"
                />
                <p className="text-xs text-secondary-400 mt-1.5">El email no se puede cambiar</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card className="overflow-hidden border-secondary-100" hover>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Información Académica</span>
                  <CardDescription className="font-normal mt-0.5">
                    Datos sobre tu carrera y universidad
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4 text-secondary-400" />
                  Universidad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Universidad de Buenos Aires"
                  value={profile.university}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, university: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Carrera
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Ingeniería en Sistemas"
                    value={profile.career}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, career: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 outline-none"
                  />
                </div>
                <Select
                  label="Año de cursada"
                  options={yearOptions}
                  value={profile.year}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, year: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <Card className="overflow-hidden border-secondary-100" hover>
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Preferencias de Estudio</span>
                  <CardDescription className="font-normal mt-0.5">
                    Personaliza cómo el copiloto genera respuestas
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-500" />
                  Estilo de estudio
                </label>
                <select
                  value={profile.studyStyle}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, studyStyle: e.target.value as 'FORMAL' | 'PRACTICAL' | 'BALANCED' }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none bg-white"
                >
                  {studyStyleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-secondary-400 mt-1.5">
                  Formal: más académico y teórico. Práctico: más ejemplos y aplicaciones.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-violet-500" />
                  Profundidad del contenido
                </label>
                <select
                  value={profile.contentDepth}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, contentDepth: e.target.value as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none bg-white"
                >
                  {contentDepthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-secondary-400 mt-1.5">
                  Ajusta el nivel de detalle de las explicaciones
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-violet-500" />
                  Idioma preferido
                </label>
                <select
                  value={profile.preferredLang}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, preferredLang: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none bg-white"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-secondary-400 mt-1.5">
                  Idioma en que se generarán los resúmenes y respuestas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Provider Selection */}
          <Card className="overflow-hidden border-secondary-100" hover>
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader className="p-6 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-lg">Copiloto de IA</span>
                  <CardDescription className="font-normal mt-0.5">
                    Selecciona tu proveedor de inteligencia artificial
                  </CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-5">
              {/* Free Provider Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-900">Usar proveedores gratuitos</p>
                    <p className="text-xs text-secondary-500">Groq (Llama 3.3) y Gemini son 100% gratis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseFreeProvider(!useFreeProvider)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    useFreeProvider ? 'bg-emerald-500' : 'bg-secondary-300'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                      useFreeProvider ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-3">
                  Proveedor preferido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providers?.available.map((provider) => (
                    <button
                      key={provider.type}
                      type="button"
                      onClick={() => setSelectedProvider(provider.type)}
                      className={cn(
                        'relative p-4 rounded-xl border-2 text-left transition-all duration-200',
                        selectedProvider === provider.type
                          ? 'border-cyan-500 bg-cyan-50 shadow-lg shadow-cyan-500/10'
                          : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-secondary-900">{provider.name}</span>
                            {provider.isFree && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                Gratis
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-secondary-500 mt-1">{provider.description}</p>
                        </div>
                        {selectedProvider === provider.type && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}

                  {/* Show placeholder if no providers loaded */}
                  {!providers && (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 rounded-xl border-2 border-secondary-100 animate-pulse">
                          <div className="h-4 w-24 bg-secondary-200 rounded mb-2" />
                          <div className="h-3 w-full bg-secondary-100 rounded" />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Info about providers */}
              <div className="p-4 rounded-xl bg-secondary-50 border border-secondary-100">
                <p className="text-sm text-secondary-600">
                  <strong>Recomendado:</strong> Groq ofrece Llama 3.3 70B gratis con inferencia ultrarrápida.
                  Google Gemini también es gratuito con límites generosos (1M tokens/día).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              isLoading={isLoading}
              className="shadow-lg shadow-primary-500/25"
            >
              <Save className="h-5 w-5 mr-2" />
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
