'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  AlertTriangle,
  Check,
  FileJson,
  FileSpreadsheet,
  Shield,
  Clock,
  X,
} from 'lucide-react';

interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'expired';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  format: 'json' | 'csv';
}

export default function DataManagementPage() {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportStatus, setExportStatus] = useState<DataExportRequest | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);

    // Simulate data export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Collect all localStorage data
    const allData: Record<string, unknown> = {};

    if (typeof window !== 'undefined') {
      // Collect all CampusMind related data from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('campusmind') || key.includes('flashcard') || key.includes('subject'))) {
          try {
            const value = localStorage.getItem(key);
            allData[key] = value ? JSON.parse(value) : value;
          } catch {
            allData[key] = localStorage.getItem(key);
          }
        }
      }
    }

    // Create export data
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: 'demo-user',
      data: {
        profile: allData['campusmind-profile'] || {},
        achievements: allData['campusmind-achievements'] || {},
        reminders: allData['campusmind-reminders'] || {},
        preferences: allData['campusmind-preferences'] || {},
        studyData: allData,
      },
    };

    // Generate file
    let blob: Blob;
    let filename: string;

    if (exportFormat === 'json') {
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      filename = `campusmind-data-export-${new Date().toISOString().split('T')[0]}.json`;
    } else {
      // Convert to CSV-like format
      const csvContent = convertToCSV(exportData);
      blob = new Blob([csvContent], { type: 'text/csv' });
      filename = `campusmind-data-export-${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Download file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportStatus({
      id: `export-${Date.now()}`,
      status: 'ready',
      requestedAt: new Date(),
      completedAt: new Date(),
      format: exportFormat,
    });

    setIsExporting(false);
  };

  const convertToCSV = (data: Record<string, unknown>): string => {
    const lines: string[] = [];
    lines.push('Category,Key,Value');

    const flattenObject = (obj: unknown, prefix = ''): void => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            flattenObject(value, newKey);
          } else {
            lines.push(`"${prefix || 'root'}","${key}","${String(value).replace(/"/g, '""')}"`);
          }
        });
      }
    };

    flattenObject(data);
    return lines.join('\n');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR MI CUENTA') return;

    setIsDeleting(true);

    // Simulate deletion process
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Clear all localStorage data
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('campusmind') || key.includes('flashcard') || key.includes('subject'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    setIsDeleting(false);
    setShowDeleteModal(false);

    // Redirect to home
    window.location.href = '/?deleted=true';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary-500" />
            Gestión de Datos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra tus datos personales según tus derechos GDPR/RGPD
          </p>
        </div>

        {/* Data Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Exportar tus Datos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Descarga una copia de toda tu información personal y datos de estudio almacenados en CampusMind.
          </p>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Formato de exportación
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'json'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <FileJson className={`h-8 w-8 ${exportFormat === 'json' ? 'text-primary-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">JSON</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Formato estructurado, ideal para desarrolladores
                  </div>
                </div>
              </button>
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  exportFormat === 'csv'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <FileSpreadsheet className={`h-8 w-8 ${exportFormat === 'csv' ? 'text-primary-500' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">CSV</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Compatible con Excel y hojas de cálculo
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* What's included */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              La exportación incluye:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Información de perfil
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Flashcards y materias
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Progreso de estudio y estadísticas
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Logros y rachas
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Notas y recursos
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Preferencias y configuración
              </li>
            </ul>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Preparando exportación...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Descargar mis datos
              </>
            )}
          </button>

          {/* Export Status */}
          {exportStatus && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">Exportación completada</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                Tu archivo {exportStatus.format.toUpperCase()} ha sido descargado exitosamente.
              </p>
            </div>
          )}
        </div>

        {/* Data Retention Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Retención de Datos
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-400">
            <p>
              Mantenemos tus datos mientras tu cuenta esté activa. Después de eliminar tu cuenta:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                Los datos personales se eliminan inmediatamente
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                Los datos de facturación se retienen por 7 años (obligación legal)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                Las copias de seguridad se eliminan en 30 días
              </li>
            </ul>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-red-200 dark:border-red-900/50">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Eliminar Cuenta
          </h2>
          <div className="mb-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <strong>Advertencia:</strong> Esta acción es permanente e irreversible.
                  Al eliminar tu cuenta:
                  <ul className="mt-2 space-y-1 ml-4 list-disc">
                    <li>Se eliminarán todos tus datos de estudio</li>
                    <li>Perderás acceso a todas las materias y flashcards</li>
                    <li>Se cancelará cualquier suscripción activa</li>
                    <li>No podrás recuperar tu cuenta ni tus datos</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Te recomendamos exportar tus datos antes de eliminar tu cuenta.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            Eliminar mi cuenta
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Eliminación
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4">
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    Esta acción eliminará permanentemente tu cuenta y todos tus datos.
                    No podrás recuperarlos.
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Para confirmar, escribe <strong>ELIMINAR MI CUENTA</strong>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="ELIMINAR MI CUENTA"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'ELIMINAR MI CUENTA' || isDeleting}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar Permanentemente'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
