'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Brain,
  ClipboardCheck,
  GitBranch,
  Lock,
  Eye,
  Clock,
  User,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SharedResource,
  getSharedByCode,
  incrementViewCount,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
} from '@/lib/sharing';

const RESOURCE_ICONS: Record<SharedResource['type'], React.ComponentType<{ className?: string }>> = {
  'note': FileText,
  'flashcard-deck': Brain,
  'quiz': ClipboardCheck,
  'mindmap': GitBranch,
};

export default function SharedResourcePage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [resource, setResource] = useState<SharedResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!code) return;

    const shared = getSharedByCode(code);
    if (!shared) {
      setError('Este recurso no existe o ha expirado');
    } else {
      setResource(shared);
      if (!shared.password) {
        setShowContent(true);
        incrementViewCount(code);
      }
    }
    setLoading(false);
  }, [code]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resource && password === resource.password) {
      setShowContent(true);
      incrementViewCount(code);
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleCopy = async () => {
    // In real app, this would copy the resource to user's account
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-secondary-900 dark:to-secondary-950 flex items-center justify-center">
        <div className="animate-pulse text-secondary-500">Cargando...</div>
      </div>
    );
  }

  if (error && !resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-secondary-900 dark:to-secondary-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
            Recurso no encontrado
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 mb-6">
            {error}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!resource) return null;

  const Icon = RESOURCE_ICONS[resource.type];

  // Password protection screen
  if (resource.password && !showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-secondary-900 dark:to-secondary-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className={cn(
              'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br',
              RESOURCE_TYPE_COLORS[resource.type]
            )}>
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">
              Recurso protegido
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              Ingresa la contraseña para ver este {RESOURCE_TYPE_LABELS[resource.type].toLowerCase()}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl bg-secondary-100 dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Acceder
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Resource content
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-secondary-900 dark:to-secondary-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
              RESOURCE_TYPE_COLORS[resource.type]
            )}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                {RESOURCE_TYPE_LABELS[resource.type]}
              </span>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mt-1 truncate">
                {resource.title}
              </h1>
              {resource.description && (
                <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                  {resource.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-secondary-500 dark:text-secondary-400">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Compartido por usuario
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {resource.viewCount} vistas
                </span>
                {resource.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expira: {new Date(resource.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {resource.allowCopy && (
            <div className="mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors',
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copiado a tu cuenta' : 'Copiar a mi cuenta'}
              </button>
            </div>
          )}
        </div>

        {/* Content Preview */}
        <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg p-6">
          <h2 className="font-semibold text-secondary-900 dark:text-white mb-4">
            Vista previa
          </h2>

          {/* Placeholder content based on type */}
          {resource.type === 'note' && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-secondary-600 dark:text-secondary-400">
                Esta es una vista previa de la nota compartida. En una implementación completa,
                aquí se mostraría el contenido real de la nota.
              </p>
              <div className="mt-4 p-4 bg-secondary-50 dark:bg-secondary-900 rounded-xl">
                <p className="text-secondary-500 dark:text-secondary-400 italic">
                  Contenido de la nota...
                </p>
              </div>
            </div>
          )}

          {resource.type === 'flashcard-deck' && (
            <div className="space-y-4">
              <p className="text-secondary-600 dark:text-secondary-400">
                Este deck de flashcards contiene tarjetas de estudio.
              </p>
              <div className="grid gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 bg-secondary-50 dark:bg-secondary-900 rounded-xl"
                  >
                    <p className="font-medium text-secondary-900 dark:text-white">
                      Tarjeta {i}
                    </p>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Pregunta de ejemplo...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resource.type === 'quiz' && (
            <div className="space-y-4">
              <p className="text-secondary-600 dark:text-secondary-400">
                Este quiz contiene preguntas de evaluación.
              </p>
              <div className="p-4 bg-secondary-50 dark:bg-secondary-900 rounded-xl">
                <p className="font-medium text-secondary-900 dark:text-white mb-2">
                  Pregunta de ejemplo
                </p>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div
                      key={opt}
                      className="p-2 bg-white dark:bg-secondary-800 rounded-lg text-sm text-secondary-600 dark:text-secondary-400"
                    >
                      {opt}. Opción de respuesta
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {resource.type === 'mindmap' && (
            <div className="space-y-4">
              <p className="text-secondary-600 dark:text-secondary-400">
                Este mapa mental organiza conceptos de forma visual.
              </p>
              <div className="p-8 bg-secondary-50 dark:bg-secondary-900 rounded-xl text-center">
                <GitBranch className="h-12 w-12 mx-auto text-secondary-400" />
                <p className="text-secondary-500 dark:text-secondary-400 mt-2">
                  Vista previa del mapa mental
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <p className="text-secondary-500 dark:text-secondary-400 mb-4">
            ¿Quieres crear tus propios recursos?
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            Únete a CampusMind gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
