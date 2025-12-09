'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { writing, WritingDocument, WritingTemplate, subjects as subjectsApi, Subject } from '@/lib/api';
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
  PenTool,
  Plus,
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  History,
  Wand2,
  Search,
  Save,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WritingPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<WritingDocument[]>([]);
  const [templates, setTemplates] = useState<WritingTemplate[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<WritingDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'ESSAY' as WritingDocument['type'],
    subjectId: '',
    templateId: '',
    targetWords: '',
  });

  const [editorContent, setEditorContent] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [docs, temps] = await Promise.all([
        writing.list(token),
        writing.getTemplates(token).catch(() => []),
      ]);
      setDocuments(docs);
      setTemplates(temps);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
      loadData();
    }
  }, [token, loadData]);

  // Create document
  const handleCreate = async () => {
    if (!token || !createForm.title) return;
    try {
      const doc = await writing.create(token, {
        title: createForm.title,
        type: createForm.type,
        subjectId: createForm.subjectId || undefined,
        templateId: createForm.templateId || undefined,
        targetWords: createForm.targetWords ? parseInt(createForm.targetWords) : undefined,
      });
      setDocuments(prev => [doc, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({ title: '', type: 'ESSAY', subjectId: '', templateId: '', targetWords: '' });
      setSelectedDoc(doc);
      setEditorContent(doc.content);
    } catch (error) {
      console.error('Error creating:', error);
    }
  };

  // Save document
  const handleSave = async () => {
    if (!token || !selectedDoc) return;
    setIsSaving(true);
    try {
      const updated = await writing.update(token, selectedDoc.id, { content: editorContent });
      setSelectedDoc(updated);
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Analyze document
  const handleAnalyze = async () => {
    if (!token || !selectedDoc) return;
    setIsAnalyzing(true);
    try {
      await handleSave();
      const result = await writing.analyze(token, selectedDoc.id);
      setSelectedDoc(prev => prev ? { ...prev, ...result } : null);
    } catch (error) {
      console.error('Error analyzing:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await writing.delete(token, id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const getStatusBadge = (status: WritingDocument['status']) => {
    const config: Record<string, { color: string; label: string }> = {
      DRAFT: { color: 'secondary', label: 'Borrador' },
      IN_PROGRESS: { color: 'warning', label: 'En progreso' },
      REVIEW: { color: 'primary', label: 'En revisión' },
      FINAL: { color: 'success', label: 'Final' },
      SUBMITTED: { color: 'success', label: 'Entregado' },
    };
    const { color, label } = config[status] || config.DRAFT;
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getTypeLabel = (type: WritingDocument['type']) => {
    const types: Record<string, string> = {
      ESSAY: 'Ensayo',
      REPORT: 'Informe',
      THESIS: 'Tesis',
      SUMMARY: 'Resumen',
      REVIEW: 'Reseña',
      LAB_REPORT: 'Informe de Lab',
      RESEARCH_PAPER: 'Paper',
      PRESENTATION: 'Presentación',
      OTHER: 'Otro',
    };
    return types[type] || type;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Editor view
  if (selectedDoc) {
    const wordCount = editorContent.split(/\s+/).filter(w => w).length;
    const progress = selectedDoc.targetWords ? Math.min(100, (wordCount / selectedDoc.targetWords) * 100) : 0;

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-secondary-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedDoc(null)} className="text-secondary-600 hover:text-secondary-900">
                ← Volver
              </button>
              <div>
                <h1 className="font-semibold text-secondary-900">{selectedDoc.title}</h1>
                <div className="flex items-center gap-2 text-sm">
                  {getStatusBadge(selectedDoc.status)}
                  <span className="text-secondary-500">{getTypeLabel(selectedDoc.type)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Analizar
              </Button>
              <Button variant="gradient" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Editor */}
          <div className="flex-1 p-6">
            <textarea
              className="w-full h-full min-h-[500px] p-4 border border-secondary-200 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-serif text-lg leading-relaxed"
              placeholder="Comienza a escribir tu documento..."
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
            />
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-secondary-200 p-4 bg-secondary-50 space-y-4 overflow-y-auto">
            {/* Word Count */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">Palabras</span>
                  <span className="font-bold text-secondary-900">{wordCount}</span>
                </div>
                {selectedDoc.targetWords && (
                  <>
                    <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          progress >= 100 ? 'bg-emerald-500' : 'bg-purple-500'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-secondary-500 mt-1">
                      Meta: {selectedDoc.targetWords} palabras ({progress.toFixed(0)}%)
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {(selectedDoc.grammarScore !== undefined || selectedDoc.styleScore !== undefined) && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Análisis IA
                  </h4>
                  <div className="space-y-3">
                    {selectedDoc.grammarScore !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Gramática</span>
                        <span className={cn("font-bold", getScoreColor(selectedDoc.grammarScore))}>
                          {selectedDoc.grammarScore}%
                        </span>
                      </div>
                    )}
                    {selectedDoc.styleScore !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Estilo</span>
                        <span className={cn("font-bold", getScoreColor(selectedDoc.styleScore))}>
                          {selectedDoc.styleScore}%
                        </span>
                      </div>
                    )}
                    {selectedDoc.plagiarismScore !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-secondary-600">Originalidad</span>
                        <span className={cn("font-bold", getScoreColor(100 - selectedDoc.plagiarismScore))}>
                          {(100 - selectedDoc.plagiarismScore).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {selectedDoc.suggestions && selectedDoc.suggestions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-secondary-900 mb-3">Sugerencias</h4>
                  <div className="space-y-2">
                    {selectedDoc.suggestions.slice(0, 5).map((suggestion, idx) => (
                      <div key={idx} className="p-2 bg-amber-50 rounded-lg text-sm">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                          <p className="text-amber-700">{suggestion.message}</p>
                        </div>
                      </div>
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

  // List view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-purple-50/80 via-white to-pink-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <PenTool className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                    Asistente de Escritura
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">Escribe mejor con ayuda de IA</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Documento
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
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<PenTool className="h-8 w-8" />}
              title="Sin documentos"
              description="Crea tu primer documento con asistencia de IA"
              action={
                <Button variant="gradient" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Documento
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <Card
                  key={doc.id}
                  className="group hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  onClick={() => { setSelectedDoc(doc); setEditorContent(doc.content); }}
                >
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-secondary-500 mb-3">
                      <Badge variant="outline" className="text-xs">{getTypeLabel(doc.type)}</Badge>
                      <span>{doc.wordCount} palabras</span>
                    </div>

                    {/* Scores if analyzed */}
                    {doc.grammarScore !== undefined && (
                      <div className="flex items-center gap-4 text-xs mb-3">
                        <span className={getScoreColor(doc.grammarScore)}>Gramática: {doc.grammarScore}%</span>
                        {doc.styleScore !== undefined && (
                          <span className={getScoreColor(doc.styleScore)}>Estilo: {doc.styleScore}%</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                      <span className="text-xs text-secondary-400">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nuevo Documento"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
            <Input
              placeholder="Mi ensayo sobre..."
              value={createForm.title}
              onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Tipo</label>
              <Select
                value={createForm.type}
                onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as WritingDocument['type'] }))}
                options={[
                  { value: 'ESSAY', label: 'Ensayo' },
                  { value: 'REPORT', label: 'Informe' },
                  { value: 'THESIS', label: 'Tesis' },
                  { value: 'SUMMARY', label: 'Resumen' },
                  { value: 'REVIEW', label: 'Reseña' },
                  { value: 'LAB_REPORT', label: 'Informe de Lab' },
                  { value: 'RESEARCH_PAPER', label: 'Paper' },
                  { value: 'OTHER', label: 'Otro' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Meta de palabras</label>
              <Input
                type="number"
                placeholder="1000"
                value={createForm.targetWords}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetWords: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Materia</label>
            <Select
              value={createForm.subjectId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Sin materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Plantilla</label>
              <Select
                value={createForm.templateId}
                onChange={(e) => setCreateForm(prev => ({ ...prev, templateId: e.target.value }))}
                options={[
                  { value: '', label: 'Sin plantilla' },
                  ...templates.map(t => ({ value: t.id, label: t.name })),
                ]}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleCreate} disabled={!createForm.title}>
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
