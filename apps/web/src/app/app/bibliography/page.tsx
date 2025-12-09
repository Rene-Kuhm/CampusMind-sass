'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { bibliography, Bibliography, Citation, CitationType, CitationStyle, subjects as subjectsApi, Subject } from '@/lib/api';
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
  BookMarked,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Download,
  Search,
  ChevronLeft,
  Loader2,
  FileText,
  Link as LinkIcon,
  Calendar,
  User,
  Tag,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CITATION_TYPES: { value: CitationType; label: string }[] = [
  { value: 'BOOK', label: 'Libro' },
  { value: 'ARTICLE', label: 'Artículo' },
  { value: 'JOURNAL', label: 'Revista' },
  { value: 'WEBSITE', label: 'Sitio Web' },
  { value: 'THESIS', label: 'Tesis' },
  { value: 'CONFERENCE', label: 'Conferencia' },
  { value: 'REPORT', label: 'Reporte' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'OTHER', label: 'Otro' },
];

const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'APA', label: 'APA 7' },
  { value: 'MLA', label: 'MLA 9' },
  { value: 'CHICAGO', label: 'Chicago' },
  { value: 'HARVARD', label: 'Harvard' },
  { value: 'IEEE', label: 'IEEE' },
  { value: 'VANCOUVER', label: 'Vancouver' },
];

export default function BibliographyPage() {
  const { token } = useAuth();
  const [bibliographies, setBibliographies] = useState<Bibliography[]>([]);
  const [selectedBib, setSelectedBib] = useState<(Bibliography & { citations: Citation[] }) | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportStyle, setExportStyle] = useState<CitationStyle>('APA');

  // Modal states
  const [isNewBibOpen, setIsNewBibOpen] = useState(false);
  const [isNewCitationOpen, setIsNewCitationOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDOIImportOpen, setIsDOIImportOpen] = useState(false);
  const [newBib, setNewBib] = useState({ name: '', description: '', subjectId: '' });
  const [newCitation, setNewCitation] = useState<Partial<Citation>>({ type: 'BOOK' });
  const [doiInput, setDoiInput] = useState('');
  const [exportedText, setExportedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  const loadBibliographies = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const bibs = await bibliography.list(token);
      setBibliographies(bibs);
    } catch (error) {
      console.error('Error loading bibliographies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBibliographies();
  }, [loadBibliographies]);

  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(setSubjects).catch(console.error);
    }
  }, [token]);

  // Load bibliography detail
  const loadBibliography = async (id: string) => {
    if (!token) return;
    try {
      const bib = await bibliography.get(token, id);
      setSelectedBib(bib);
    } catch (error) {
      console.error('Error loading bibliography:', error);
    }
  };

  // Create bibliography
  const handleCreateBib = async () => {
    if (!token || !newBib.name) return;
    setIsSubmitting(true);
    try {
      const bib = await bibliography.create(token, newBib);
      setBibliographies(prev => [...prev, bib]);
      setIsNewBibOpen(false);
      setNewBib({ name: '', description: '', subjectId: '' });
    } catch (error) {
      console.error('Error creating bibliography:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete bibliography
  const handleDeleteBib = async (id: string) => {
    if (!token) return;
    try {
      await bibliography.delete(token, id);
      setBibliographies(prev => prev.filter(b => b.id !== id));
      if (selectedBib?.id === id) setSelectedBib(null);
    } catch (error) {
      console.error('Error deleting bibliography:', error);
    }
  };

  // Add citation
  const handleAddCitation = async () => {
    if (!token || !selectedBib || !newCitation.title || !newCitation.type) return;
    setIsSubmitting(true);
    try {
      const citation = await bibliography.addCitation(token, selectedBib.id, newCitation);
      setSelectedBib(prev => prev ? { ...prev, citations: [...prev.citations, citation] } : null);
      setIsNewCitationOpen(false);
      setNewCitation({ type: 'BOOK' });
    } catch (error) {
      console.error('Error adding citation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete citation
  const handleDeleteCitation = async (citationId: string) => {
    if (!token) return;
    try {
      await bibliography.deleteCitation(token, citationId);
      setSelectedBib(prev => prev ? {
        ...prev,
        citations: prev.citations.filter(c => c.id !== citationId)
      } : null);
    } catch (error) {
      console.error('Error deleting citation:', error);
    }
  };

  // Import from DOI
  const handleImportDOI = async () => {
    if (!token || !selectedBib || !doiInput) return;
    setIsSubmitting(true);
    try {
      const citation = await bibliography.importFromDOI(token, selectedBib.id, doiInput);
      setSelectedBib(prev => prev ? { ...prev, citations: [...prev.citations, citation] } : null);
      setIsDOIImportOpen(false);
      setDoiInput('');
    } catch (error) {
      console.error('Error importing DOI:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export
  const handleExport = async () => {
    if (!token || !selectedBib) return;
    try {
      const result = await bibliography.export(token, selectedBib.id, exportStyle);
      setExportedText(result.formatted);
      setIsExportOpen(true);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detail view
  if (selectedBib) {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
          <div className="relative p-6">
            <button
              onClick={() => setSelectedBib(null)}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <BookMarked className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">{selectedBib.name}</h1>
                  <p className="text-secondary-500">{selectedBib.citations.length} citas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsDOIImportOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Importar DOI
                </Button>
                <Button variant="outline" onClick={() => setIsNewCitationOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cita
                </Button>
                <div className="flex items-center gap-2">
                  <Select
                    value={exportStyle}
                    onChange={(e) => setExportStyle(e.target.value as CitationStyle)}
                    options={CITATION_STYLES}
                  />
                  <Button variant="gradient" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {selectedBib.citations.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="Sin citas"
                description="Agrega tu primera cita bibliográfica"
                action={
                  <Button variant="gradient" onClick={() => setIsNewCitationOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cita
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {selectedBib.citations.map(citation => (
                  <Card key={citation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{citation.type}</Badge>
                            {citation.year && <span className="text-sm text-secondary-500">{citation.year}</span>}
                          </div>
                          <h3 className="font-medium text-secondary-900">{citation.title}</h3>
                          {citation.authors && citation.authors.length > 0 && (
                            <p className="text-sm text-secondary-600 mt-1">
                              <User className="h-3 w-3 inline mr-1" />
                              {citation.authors.join(', ')}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-secondary-500">
                            {citation.publisher && <span>{citation.publisher}</span>}
                            {citation.journal && <span>{citation.journal}</span>}
                            {citation.doi && (
                              <a
                                href={`https://doi.org/${citation.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline flex items-center gap-1"
                              >
                                DOI <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCitation(citation.id)}
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

        {/* New Citation Modal */}
        <Modal
          isOpen={isNewCitationOpen}
          onClose={() => setIsNewCitationOpen(false)}
          title="Agregar Cita"
          variant="glass"
          size="lg"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Tipo *</label>
                <Select
                  value={newCitation.type}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, type: e.target.value as CitationType }))}
                  options={CITATION_TYPES}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Año</label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={newCitation.year || ''}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, year: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
              <Input
                placeholder="Título de la obra"
                value={newCitation.title || ''}
                onChange={(e) => setNewCitation(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Autores (separados por coma)</label>
              <Input
                placeholder="Apellido, N.; Apellido, N."
                value={newCitation.authors?.join(', ') || ''}
                onChange={(e) => setNewCitation(prev => ({ ...prev, authors: e.target.value.split(',').map(a => a.trim()) }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Editorial</label>
                <Input
                  placeholder="Nombre de la editorial"
                  value={newCitation.publisher || ''}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, publisher: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">DOI</label>
                <Input
                  placeholder="10.1000/xyz123"
                  value={newCitation.doi || ''}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, doi: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">URL</label>
              <Input
                placeholder="https://..."
                value={newCitation.url || ''}
                onChange={(e) => setNewCitation(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsNewCitationOpen(false)}>Cancelar</Button>
              <Button
                variant="gradient"
                onClick={handleAddCitation}
                disabled={!newCitation.title || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Agregar
              </Button>
            </div>
          </div>
        </Modal>

        {/* DOI Import Modal */}
        <Modal
          isOpen={isDOIImportOpen}
          onClose={() => setIsDOIImportOpen(false)}
          title="Importar desde DOI"
          variant="glass"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-secondary-600">Ingresa el DOI del artículo para importar automáticamente la información bibliográfica.</p>
            <Input
              placeholder="10.1000/xyz123"
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDOIImportOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleImportDOI} disabled={!doiInput || isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                Importar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Export Modal */}
        <Modal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          title={`Exportar en formato ${exportStyle}`}
          variant="glass"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-secondary-50 rounded-lg p-4 max-h-80 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-secondary-700 font-mono">{exportedText}</pre>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleCopy(exportedText)}>
                {copied ? <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button variant="gradient" onClick={() => setIsExportOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Main list view
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <BookMarked className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                    Bibliografías
                  </span>
                </h1>
                <p className="text-secondary-500">Gestiona tus referencias bibliográficas</p>
              </div>
            </div>
            <Button variant="gradient" onClick={() => setIsNewBibOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Bibliografía
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : bibliographies.length === 0 ? (
            <EmptyState
              icon={<BookMarked className="h-8 w-8" />}
              title="Sin bibliografías"
              description="Crea tu primera bibliografía para organizar tus referencias"
              action={
                <Button variant="gradient" onClick={() => setIsNewBibOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Bibliografía
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bibliographies.map(bib => (
                <Card
                  key={bib.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => loadBibliography(bib.id)}
                >
                  <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <BookMarked className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900">{bib.name}</h3>
                          <p className="text-sm text-secondary-500">{bib.citationCount} citas</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBib(bib.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {bib.description && (
                      <p className="text-sm text-secondary-600 mt-3 line-clamp-2">{bib.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Bibliography Modal */}
      <Modal
        isOpen={isNewBibOpen}
        onClose={() => setIsNewBibOpen(false)}
        title="Nueva Bibliografía"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
            <Input
              placeholder="Ej: Tesis de Grado"
              value={newBib.name}
              onChange={(e) => setNewBib(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Descripción</label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl resize-none"
              rows={3}
              placeholder="Descripción opcional"
              value={newBib.description}
              onChange={(e) => setNewBib(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Materia</label>
            <Select
              value={newBib.subjectId}
              onChange={(e) => setNewBib(prev => ({ ...prev, subjectId: e.target.value }))}
              options={[
                { value: '', label: 'Sin materia' },
                ...subjects.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsNewBibOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleCreateBib} disabled={!newBib.name || isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
