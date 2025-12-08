'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
  Key,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface TwoFactorSetupProps {
  accessToken: string;
  apiBaseUrl?: string;
  onStatusChange?: (enabled: boolean) => void;
}

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
  instructions: string[];
}

interface EnableResult {
  success: boolean;
  backupCodes: string[];
  warning: string;
}

export default function TwoFactorSetup({
  accessToken,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  onStatusChange,
}: TwoFactorSetupProps) {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup'>('status');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Error al obtener estado de 2FA');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError('Error al iniciar configuración de 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data: EnableResult = await response.json();

      if (!response.ok) {
        setError((data as unknown as { message: string }).message || 'Código inválido');
        return;
      }

      setBackupCodes(data.backupCodes);
      setSuccessMessage('2FA habilitado exitosamente');
      setStep('backup');
      onStatusChange?.(true);
    } catch (err) {
      setError('Error al habilitar 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!verificationCode) {
      setError('Ingresa tu código de autenticación');
      return;
    }

    if (!confirm('¿Estás seguro de desactivar la autenticación de dos factores?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/2fa/disable`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Código inválido');
        return;
      }

      setSuccessMessage('2FA deshabilitado');
      setStatus({ enabled: false, backupCodesRemaining: 0 });
      setVerificationCode('');
      setStep('status');
      onStatusChange?.(false);
    } catch (err) {
      setError('Error al deshabilitar 2FA');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    if (!verificationCode) {
      setError('Ingresa tu código de autenticación');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/api/v1/auth/2fa/backup-codes/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error al regenerar códigos');
        return;
      }

      setBackupCodes(data.backupCodes);
      setSuccessMessage('Nuevos códigos generados');
      setShowBackupCodes(true);
      setVerificationCode('');
    } catch (err) {
      setError('Error al regenerar códigos de respaldo');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setSuccessMessage('Códigos copiados al portapapeles');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-full ${status?.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
          {status?.enabled ? (
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          ) : (
            <Shield className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Autenticación de Dos Factores (2FA)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {status?.enabled ? 'Habilitado' : 'Deshabilitado'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Status View */}
      {step === 'status' && !status?.enabled && (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Agrega una capa extra de seguridad a tu cuenta usando una aplicación de autenticación como Google Authenticator o Authy.
          </p>
          <button
            onClick={startSetup}
            disabled={actionLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Smartphone className="h-5 w-5" />
            )}
            Configurar 2FA
          </button>
        </div>
      )}

      {step === 'status' && status?.enabled && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-700 dark:text-green-400 font-medium">
              Tu cuenta está protegida con 2FA
            </p>
            <p className="text-sm text-green-600 dark:text-green-500 mt-1">
              Códigos de respaldo disponibles: {status.backupCodesRemaining}/8
            </p>
          </div>

          {status.backupCodesRemaining <= 2 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Te quedan pocos códigos de respaldo. Considera regenerarlos.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Código de autenticación
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={regenerateBackupCodes}
                disabled={actionLoading || verificationCode.length !== 6}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerar Códigos
              </button>
              <button
                onClick={disable2FA}
                disabled={actionLoading || verificationCode.length !== 6}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                <ShieldOff className="h-4 w-4" />
                Desactivar 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup View */}
      {step === 'setup' && setupData && (
        <div className="space-y-6">
          <div className="text-center">
            <img
              src={setupData.qrCodeUrl}
              alt="QR Code"
              className="mx-auto w-48 h-48 rounded-lg border-2 border-gray-200 dark:border-gray-700"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Escanea este código con tu app de autenticación
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              O ingresa esta clave manualmente:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-600">
                {setupData.secret}
              </code>
              <button
                onClick={() => copyToClipboard(setupData.secret)}
                className="p-2 text-gray-500 hover:text-primary-500"
                title="Copiar"
              >
                {copiedSecret ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingresa el código de 6 dígitos de tu app
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('status');
                setSetupData(null);
                setVerificationCode('');
              }}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={verifyAndEnable}
              disabled={actionLoading || verificationCode.length !== 6}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
              Verificar y Activar
            </button>
          </div>
        </div>
      )}

      {/* Backup Codes View */}
      {(step === 'backup' || showBackupCodes) && backupCodes.length > 0 && (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Key className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">
                  Guarda estos códigos de respaldo
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                  Úsalos si pierdes acceso a tu aplicación de autenticación. Cada código solo puede usarse una vez.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            {backupCodes.map((code, index) => (
              <code
                key={index}
                className="text-center font-mono text-sm py-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
              >
                {code}
              </code>
            ))}
          </div>

          <button
            onClick={copyBackupCodes}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Copy className="h-4 w-4" />
            Copiar todos los códigos
          </button>

          {step === 'backup' && (
            <button
              onClick={() => {
                setStep('status');
                setBackupCodes([]);
                fetchStatus();
              }}
              className="w-full px-4 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
              Continuar
            </button>
          )}

          {showBackupCodes && step !== 'backup' && (
            <button
              onClick={() => setShowBackupCodes(false)}
              className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cerrar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
