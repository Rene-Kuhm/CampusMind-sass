'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transcription, Transcription, subjects as subjectsApi, Subject } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Mic,
  Upload,
  FileAudio,
  FileVideo,
  Trash2,
  RefreshCw,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  Sparkles,
  Languages,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TranscriptionPage() {
  const { token } = useAuth();
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    duration: 0,
    subjectId: '',
    language: 'es',
  });

  // Load transcriptions
  const loadTranscriptions = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await transcription.list(token);
      setTranscriptions(data);
    } catch (error) {
      console.error('Error loading transcriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  useEffect(() => {
    loadTranscriptions();
  }, [loadTranscriptions]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileUrl: fakeUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  // Process transcription
  const handleProcess = async () => {
    if (!token || !uploadForm.fileUrl) return;
    setIsProcessing(true);
    try {
      const result = await transcription.transcribe(token, uploadForm);
      setTranscriptions(prev => [result, ...prev]);
      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
        duration: 0,
        subjectId: '',
        language: 'es',
      });
    } catch (error) {
      console.error('Error processing transcription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete transcription
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await transcription.delete(token, id);
      setTranscriptions(prev => prev.filter(t => t.id !== id));
      if (selectedTranscription?.id === id) setSelectedTranscription(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Copy text
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export transcription
  const handleExport = async (id: string, format: 'txt' | 'srt' | 'vtt') => {
    if (!token) return;
    try {
      const blob = await transcription.export(token, id, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const getStatusBadge = (status: Transcription['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Procesando</Badge>;
      case 'FAILED':
        return <Badge variant="danger"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) {
      return <FileVideo className="h-6 w-6 text-white" />;
    }
    return <FileAudio className="h-6 w-6 text-white" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Detail view
  if (selectedTranscription) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedTranscription(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Mic className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedTranscription.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedTranscription.status)}
                    <span className="text-sm text-secondary-500">
                      {selectedTranscription.duration && formatDuration(selectedTranscription.duration)}
                    </span>
                    <span className="text-sm text-secondary-500">
                      {new Date(selectedTranscription.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleExport(selectedTranscription.id, 'txt')}>
                  <Download className="h-4 w-4 mr-2" />
                  TXT
                </Button>
                <Button variant="outline" onClick={() => handleExport(selectedTranscription.id, 'srt')}>
                  <Download className="h-4 w-4 mr-2" />
                  SRT
                </Button>
                <Button variant="outline" onClick={() => handleDelete(selectedTranscription.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Audio/Video Preview */}
            {selectedTranscription.fileUrl && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3">Archivo Original</h3>
                  {selectedTranscription.fileType?.startsWith('video/') ? (
                    <video
                      src={selectedTranscription.fileUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <audio
                      src={selectedTranscription.fileUrl}
                      controls
                      className="w-full"
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transcription Text */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-secondary-900">Transcripción</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(selectedTranscription.transcribedText || '')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-secondary-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {selectedTranscription.segments && selectedTranscription.segments.length > 0 ? (
                      selectedTranscription.segments.map((segment, index) => (
                        <div key={index} className="flex gap-3">
                          <span className="text-xs text-secondary-400 font-mono whitespace-nowrap">
                            {formatDuration(Math.floor(segment.start))}
                          </span>
                          <p className="text-sm text-secondary-700">{segment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-secondary-700">
                        {selectedTranscription.transcribedText || 'Sin transcripción disponible'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary if available */}
            {selectedTranscription.summary && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-rose-500" />
                    <h3 className="font-semibold text-secondary-900">Resumen IA</h3>
                  </div>
                  <p className="text-secondary-700">{selectedTranscription.summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-rose-50/80 via-white to-pink-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Mic className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">
                    Transcripción de Audio/Video
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Convierte audio y video a texto con IA
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Archivo
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : transcriptions.length === 0 ? (
            <EmptyState
              icon={<Mic className="h-8 w-8" />}
              title="Sin transcripciones"
              description="Sube tu primer archivo de audio o video para transcribir"
              action={
                <Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transcriptions.map(t => (
                <Card
                  key={t.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedTranscription(t)}
                >
                  <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                        {getFileIcon(t.fileType || '')}
                      </div>
                      {getStatusBadge(t.status)}
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1 truncate">{t.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-secondary-500 mb-3">
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      {t.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(t.duration)}</span>
                        </>
                      )}
                    </div>
                    {t.transcribedText && (
                      <p className="text-sm text-secondary-600 line-clamp-2">
                        {t.transcribedText.substring(0, 100)}...
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Subir Audio/Video"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-rose-500" />
              <span className="font-medium text-rose-700">Transcripción con IA</span>
            </div>
            <p className="text-sm text-rose-600">
              Sube un archivo de audio o video y lo transcribiremos automáticamente con alta precisión.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Archivo *
            </label>
            <div className="border-2 border-dashed border-secondary-200 rounded-xl p-6 text-center hover:border-rose-400 transition-colors">
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="transcription-file-input"
              />
              <label htmlFor="transcription-file-input" className="cursor-pointer">
                {uploadForm.fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="h-8 w-8 text-rose-500" />
                    <span className="text-secondary-700">{uploadForm.fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-500">Arrastra o haz clic para subir</p>
                    <p className="text-sm text-secondary-400">MP3, WAV, MP4, WebM hasta 100MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Título *
            </label>
            <Input
              placeholder="Nombre de la transcripción"
              value={uploadForm.title}
              onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Materia
              </label>
              <Select
                value={uploadForm.subjectId}
                onChange={(e) => setUploadForm(prev => ({ ...prev, subjectId: e.target.value }))}
                options={[
                  { value: '', label: 'Sin materia' },
                  ...subjects.map(s => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Idioma
              </label>
              <Select
                value={uploadForm.language}
                onChange={(e) => setUploadForm(prev => ({ ...prev, language: e.target.value }))}
                options={[
                  { value: 'es', label: 'Español' },
                  { value: 'en', label: 'English' },
                  { value: 'pt', label: 'Português' },
                  { value: 'fr', label: 'Français' },
                  { value: 'de', label: 'Deutsch' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleProcess}
              disabled={!uploadForm.fileUrl || !uploadForm.title || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Transcribir
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
