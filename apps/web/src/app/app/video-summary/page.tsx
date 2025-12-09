'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { videoSummary, VideoSummary, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Youtube,
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  ExternalLink,
  BookOpen,
  ListOrdered,
  Tag,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VideoSummaryPage() {
  const { token } = useAuth();
  const [summaries, setSummaries] = useState<VideoSummary[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<VideoSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    youtubeUrl: '',
    subjectId: '',
    generateNotes: true,
    generateFlashcards: false,
  });

  // Load summaries
  const loadSummaries = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await videoSummary.list(token);
      setSummaries(data);
    } catch (error) {
      console.error('Error loading video summaries:', error);
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
    loadSummaries();
  }, [loadSummaries]);

  // Summarize video
  const handleSummarize = async () => {
    if (!token || !createForm.youtubeUrl) return;
    setIsProcessing(true);
    try {
      const summary = await videoSummary.summarize(token, createForm);
      setSummaries(prev => [summary, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        youtubeUrl: '',
        subjectId: '',
        generateNotes: true,
        generateFlashcards: false,
      });
      setSelectedSummary(summary);
    } catch (error) {
      console.error('Error summarizing video:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete summary
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await videoSummary.delete(token, id);
      setSummaries(prev => prev.filter(s => s.id !== id));
      if (selectedSummary?.id === id) setSelectedSummary(null);
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

  const getStatusBadge = (status: VideoSummary['status']) => {
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

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYoutubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  // Detail view
  if (selectedSummary) {
    const videoId = getYoutubeVideoId(selectedSummary.youtubeUrl || selectedSummary.videoUrl);

    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-red-50/80 via-white to-orange-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedSummary(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Youtube className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900 line-clamp-1">{selectedSummary.videoTitle}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedSummary.status)}
                    {selectedSummary.videoDuration && (
                      <span className="text-sm text-secondary-500">
                        {formatDuration(selectedSummary.videoDuration)}
                      </span>
                    )}
                    <span className="text-sm text-secondary-500">
                      {selectedSummary.channelName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedSummary.youtubeUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver en YouTube
                </Button>
                <Button variant="outline" onClick={() => handleDelete(selectedSummary.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Video Embed */}
            {videoId && (
              <Card>
                <CardContent className="p-0 overflow-hidden rounded-xl">
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={selectedSummary.videoTitle}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-red-500" />
                      <h3 className="font-semibold text-secondary-900">Resumen</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(selectedSummary.summary || '')}
                    >
                      {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-secondary-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-sm text-secondary-700 whitespace-pre-wrap">
                      {selectedSummary.summary || 'Sin resumen disponible'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Key Points */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ListOrdered className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-secondary-900">Puntos Clave</h3>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedSummary.keyPoints && selectedSummary.keyPoints.length > 0 ? (
                      selectedSummary.keyPoints.map((point, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-secondary-50 rounded-lg"
                        >
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-sm text-secondary-700">{point}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary-500 text-center py-4">
                        Sin puntos clave
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timestamps */}
            {selectedSummary.timestamps && selectedSummary.timestamps.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-secondary-900">Marcas de Tiempo</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedSummary.timestamps.map((ts, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          const url = `${selectedSummary.youtubeUrl}&t=${ts.time}`;
                          window.open(url, '_blank');
                        }}
                        className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors text-left"
                      >
                        <span className="text-sm font-mono text-red-500 whitespace-nowrap">
                          {formatDuration(ts.time)}
                        </span>
                        <span className="text-sm text-secondary-700 line-clamp-1">{ts.topic}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {selectedSummary.tags && selectedSummary.tags.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-secondary-900">Etiquetas</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSummary.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
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
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-red-50/80 via-white to-orange-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Youtube className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                    Resúmenes de Video
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Resume videos de YouTube con IA
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Resumen
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
          ) : summaries.length === 0 ? (
            <EmptyState
              icon={<Youtube className="h-8 w-8" />}
              title="Sin resúmenes"
              description="Pega un enlace de YouTube para generar un resumen con IA"
              action={
                <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Resumen
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.map(summary => {
                const videoId = getYoutubeVideoId(summary.youtubeUrl || summary.videoUrl);
                return (
                  <Card
                    key={summary.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedSummary(summary)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-secondary-100">
                      {videoId ? (
                        <img
                          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                          alt={summary.videoTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Youtube className="h-12 w-12 text-secondary-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                      {summary.videoDuration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(summary.videoDuration)}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(summary.status)}
                      </div>
                      <h3 className="font-semibold text-secondary-900 mb-1 line-clamp-2">{summary.videoTitle}</h3>
                      <p className="text-sm text-secondary-500 mb-2">{summary.channelName}</p>
                      {summary.summary && (
                        <p className="text-sm text-secondary-600 line-clamp-2">
                          {summary.summary.substring(0, 100)}...
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-secondary-100 mt-3">
                        <span className="text-xs text-secondary-400">
                          {new Date(summary.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(summary.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Resumir Video de YouTube"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-red-500" />
              <span className="font-medium text-red-700">Resumen con IA</span>
            </div>
            <p className="text-sm text-red-600">
              Pega un enlace de YouTube y generaremos un resumen, puntos clave y marcas de tiempo.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              URL de YouTube *
            </label>
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={createForm.youtubeUrl}
              onChange={(e) => setCreateForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Materia (opcional)
            </label>
            <Select
              value={createForm.subjectId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Sin materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.generateNotes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, generateNotes: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Generar notas automáticamente</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createForm.generateFlashcards}
                onChange={(e) => setCreateForm(prev => ({ ...prev, generateFlashcards: e.target.checked }))}
                className="rounded border-secondary-300"
              />
              <span className="text-sm text-secondary-700">Generar flashcards del contenido</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={handleSummarize}
              disabled={!createForm.youtubeUrl || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Resumir Video
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
