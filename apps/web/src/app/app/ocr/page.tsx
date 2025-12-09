'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ocr, OcrDocument, subjects as subjectsApi, Subject } from '@/lib/api';
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
  ScanText,
  Upload,
  FileText,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OcrPage() {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<OcrDocument[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<OcrDocument | null>(null);
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
    fileSize: 0,
    subjectId: '',
    language: 'es',
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const docs = await ocr.list(token);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading OCR documents:', error);
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
    loadDocuments();
  }, [loadDocuments]);

  // Handle file selection (simulated - in real app would upload to storage)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to S3/Cloudinary and get URL
      const fakeUrl = URL.createObjectURL(file);
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fakeUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  // Process image
  const handleProcess = async () => {
    if (!token || !uploadForm.fileUrl) return;
    setIsProcessing(true);
    try {
      const doc = await ocr.process(token, uploadForm);
      setDocuments(prev => [doc, ...prev]);
      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        fileUrl: '',
        fileName: '',
        fileType: '',
        fileSize: 0,
        subjectId: '',
        language: 'es',
      });
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reprocess document
  const handleReprocess = async (id: string) => {
    if (!token) return;
    try {
      const updated = await ocr.reprocess(token, id);
      setDocuments(prev => prev.map(d => d.id === id ? updated : d));
      if (selectedDoc?.id === id) setSelectedDoc(updated);
    } catch (error) {
      console.error('Error reprocessing:', error);
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ocr.delete(token, id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
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

  const getStatusBadge = (status: OcrDocument['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Procesando</Badge>;
      case 'FAILED':
        return <Badge variant="error"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  // Detail view
  if (selectedDoc) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-cyan-50/80 via-white to-teal-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="relative p-6">
            <button
              onClick={() => setSelectedDoc(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              ← Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedDoc.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedDoc.status)}
                    <span className="text-sm text-secondary-500">
                      {new Date(selectedDoc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => handleReprocess(selectedDoc.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocesar
                </Button>
                <Button variant="outline" onClick={() => handleDelete(selectedDoc.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Preview */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-secondary-900 mb-3">Imagen Original</h3>
                <div className="aspect-[4/3] bg-secondary-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Extracted Text */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-secondary-900">Texto Extraído</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(selectedDoc.enhancedText || selectedDoc.extractedText)}
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-secondary-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-secondary-700 font-mono">
                    {selectedDoc.enhancedText || selectedDoc.extractedText || 'Sin texto extraído'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-cyan-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                <ScanText className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-teal-500">
                    OCR - Extracción de Texto
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Extrae texto de imágenes con IA
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir Imagen
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
              icon={<ScanText className="h-8 w-8" />}
              title="Sin documentos"
              description="Sube tu primera imagen para extraer texto"
              action={
                <Button variant="gradient" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Imagen
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <Card
                  key={doc.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                    <h3 className="font-semibold text-secondary-900 mb-1 truncate">{doc.title}</h3>
                    <p className="text-sm text-secondary-500 mb-3">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                    {doc.extractedText && (
                      <p className="text-sm text-secondary-600 line-clamp-2">
                        {doc.extractedText.substring(0, 100)}...
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
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
        title="Subir Imagen para OCR"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <span className="font-medium text-cyan-700">OCR con IA</span>
            </div>
            <p className="text-sm text-cyan-600">
              Sube una imagen y extraeremos el texto automáticamente con mejoras de IA.
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Imagen *
            </label>
            <div className="border-2 border-dashed border-secondary-200 rounded-xl p-6 text-center hover:border-cyan-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="ocr-file-input"
              />
              <label htmlFor="ocr-file-input" className="cursor-pointer">
                {uploadForm.fileName ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8 text-cyan-500" />
                    <span className="text-secondary-700">{uploadForm.fileName}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-secondary-500">Arrastra o haz clic para subir</p>
                    <p className="text-sm text-secondary-400">PNG, JPG hasta 10MB</p>
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
              placeholder="Nombre del documento"
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
                  <ScanText className="h-4 w-4 mr-2" />
                  Extraer Texto
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
