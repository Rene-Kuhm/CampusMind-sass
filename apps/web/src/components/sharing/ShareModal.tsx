'use client';

import { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  Globe,
  Lock,
  Clock,
  Eye,
  Shield,
  Share2,
  Twitter,
  Facebook,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SharedResource,
  ShareOptions,
  createShare,
  getShareUrl,
  copyToClipboard,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_COLORS,
} from '@/lib/sharing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: SharedResource['type'];
  resourceId: string;
  resourceTitle: string;
  resourceDescription?: string;
  onShared?: (share: SharedResource) => void;
}

const EXPIRATION_OPTIONS = [
  { label: 'Nunca', value: undefined },
  { label: '1 hora', value: 1 },
  { label: '24 horas', value: 24 },
  { label: '7 días', value: 168 },
  { label: '30 días', value: 720 },
];

export function ShareModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  resourceDescription,
  onShared,
}: ShareModalProps) {
  const [step, setStep] = useState<'options' | 'share'>('options');
  const [share, setShare] = useState<SharedResource | null>(null);
  const [copied, setCopied] = useState(false);

  // Share options
  const [isPublic, setIsPublic] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [expiresIn, setExpiresIn] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);

  if (!isOpen) return null;

  const handleCreateShare = () => {
    const options: ShareOptions = {
      isPublic,
      allowCopy,
      expiresIn,
      password: usePassword && password ? password : undefined,
    };

    const newShare = createShare(
      resourceType,
      resourceId,
      resourceTitle,
      resourceDescription,
      'user-1', // Demo user
      options
    );

    setShare(newShare);
    setStep('share');
    onShared?.(newShare);
  };

  const handleCopyLink = async () => {
    if (!share) return;
    const url = getShareUrl(share.shareCode);
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = share ? getShareUrl(share.shareCode) : '';

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'whatsapp' | 'email') => {
    if (!share) return;
    const text = `Mira este recurso: ${resourceTitle}`;
    const url = encodeURIComponent(shareUrl);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(resourceTitle)}&body=${encodeURIComponent(text + '\n\n' + shareUrl)}`,
    };

    window.open(urls[platform], '_blank');
  };

  const handleClose = () => {
    setStep('options');
    setShare(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-md bg-white dark:bg-secondary-900 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
              RESOURCE_TYPE_COLORS[resourceType]
            )}>
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-secondary-900 dark:text-white">
                {step === 'options' ? 'Compartir recurso' : 'Enlace creado'}
              </h2>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                {RESOURCE_TYPE_LABELS[resourceType]}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'options' ? (
          /* Options Step */
          <div className="p-4 space-y-4">
            {/* Resource preview */}
            <div className="p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800">
              <h3 className="font-medium text-secondary-900 dark:text-white truncate">
                {resourceTitle}
              </h3>
              {resourceDescription && (
                <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1 line-clamp-2">
                  {resourceDescription}
                </p>
              )}
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Visibilidad
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    'p-3 rounded-xl border-2 flex items-center gap-3 transition-colors',
                    isPublic
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  <Globe className={cn('h-5 w-5', isPublic ? 'text-primary-500' : 'text-secondary-400')} />
                  <span className={cn('text-sm font-medium', isPublic ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-600 dark:text-secondary-400')}>
                    Público
                  </span>
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    'p-3 rounded-xl border-2 flex items-center gap-3 transition-colors',
                    !isPublic
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  <Lock className={cn('h-5 w-5', !isPublic ? 'text-primary-500' : 'text-secondary-400')} />
                  <span className={cn('text-sm font-medium', !isPublic ? 'text-primary-700 dark:text-primary-300' : 'text-secondary-600 dark:text-secondary-400')}>
                    Solo enlace
                  </span>
                </button>
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                <Clock className="h-4 w-4 inline mr-2" />
                Expiración
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPIRATION_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => setExpiresIn(option.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      expiresIn === option.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Allow copy */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800">
              <div className="flex items-center gap-3">
                <Copy className="h-5 w-5 text-secondary-500" />
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white text-sm">
                    Permitir copiar
                  </p>
                  <p className="text-xs text-secondary-500">
                    Los usuarios pueden duplicar el recurso
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAllowCopy(!allowCopy)}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  allowCopy ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                )}
              >
                <span className={cn(
                  'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                  allowCopy ? 'left-6' : 'left-1'
                )} />
              </button>
            </div>

            {/* Password protection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-secondary-500" />
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white text-sm">
                      Proteger con contraseña
                    </p>
                    <p className="text-xs text-secondary-500">
                      Requiere contraseña para ver
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUsePassword(!usePassword)}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    usePassword ? 'bg-primary-500' : 'bg-secondary-300 dark:bg-secondary-600'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                    usePassword ? 'left-6' : 'left-1'
                  )} />
                </button>
              </div>
              {usePassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa una contraseña"
                  className="w-full px-4 py-2 rounded-xl bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
            </div>

            {/* Create button */}
            <button
              onClick={handleCreateShare}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Crear enlace para compartir
            </button>
          </div>
        ) : (
          /* Share Step */
          <div className="p-4 space-y-4">
            {/* Success message */}
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                ¡Enlace creado!
              </h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400">
                Comparte este enlace con quien quieras
              </p>
            </div>

            {/* Share link */}
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white text-sm font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className={cn(
                  'px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-2',
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* Share info */}
            {share && (
              <div className="flex items-center justify-center gap-4 text-sm text-secondary-500 dark:text-secondary-400">
                <span className="flex items-center gap-1">
                  {share.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {share.isPublic ? 'Público' : 'Solo enlace'}
                </span>
                {share.expiresAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expira: {new Date(share.expiresAt).toLocaleDateString()}
                  </span>
                )}
                {share.password && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Con contraseña
                  </span>
                )}
              </div>
            )}

            {/* Social share */}
            <div>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 text-center mb-3">
                O comparte en redes sociales
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="p-3 rounded-xl bg-[#1DA1F2] text-white hover:bg-[#1a8cd8] transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="p-3 rounded-xl bg-[#4267B2] text-white hover:bg-[#375695] transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleSocialShare('whatsapp')}
                  className="p-3 rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleSocialShare('email')}
                  className="p-3 rounded-xl bg-secondary-600 text-white hover:bg-secondary-700 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Done button */}
            <button
              onClick={handleClose}
              className="w-full py-3 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 rounded-xl font-medium hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
            >
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for easy use
export function useShareModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [shareProps, setShareProps] = useState<Omit<ShareModalProps, 'isOpen' | 'onClose'> | null>(null);

  const openShare = (props: Omit<ShareModalProps, 'isOpen' | 'onClose'>) => {
    setShareProps(props);
    setIsOpen(true);
  };

  const closeShare = () => {
    setIsOpen(false);
    setShareProps(null);
  };

  return {
    isOpen,
    shareProps,
    openShare,
    closeShare,
  };
}
