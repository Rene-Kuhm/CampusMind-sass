'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  Spinner,
  Modal,
  DocumentViewer,
} from '@/components/ui';
import {
  academic,
  subjects as subjectsApi,
  AcademicResource,
  AcademicSearchParams,
  AcademicSource,
  SearchCategory,
  Subject,
  ResourceType,
  ResourceLevel,
  UnifiedSearchResult,
} from '@/lib/api';
import {
  Search,
  Filter,
  ExternalLink,
  Plus,
  BookOpen,
  FileText,
  Users,
  Calendar,
  Download,
  CheckCircle,
  Video,
  BookMarked,
  GraduationCap,
  Globe,
  Play,
  Clock,
  File,
  Stethoscope,
  Sparkles,
  Zap,
  TrendingUp,
  Library,
  X,
} from 'lucide-react';
import { resourceTypeLabels, resourceLevelLabels, cn } from '@/lib/utils';
import Image from 'next/image';

// Category configuration with premium styling
const categoryConfig: Record<SearchCategory, { label: string; icon: React.ReactNode; description: string; gradient: string }> = {
  all: { label: 'Todos', icon: <Globe className="h-4 w-4" />, description: 'Buscar en todas las fuentes', gradient: 'from-slate-500 to-slate-600' },
  papers: { label: 'Papers', icon: <FileText className="h-4 w-4" />, description: 'Artículos científicos', gradient: 'from-blue-500 to-cyan-500' },
  books: { label: 'Libros', icon: <BookMarked className="h-4 w-4" />, description: 'Libros y manuales', gradient: 'from-violet-500 to-purple-500' },
  videos: { label: 'Videos', icon: <Video className="h-4 w-4" />, description: 'Videos educativos', gradient: 'from-red-500 to-rose-500' },
  courses: { label: 'Cursos', icon: <GraduationCap className="h-4 w-4" />, description: 'Cursos y tutoriales', gradient: 'from-emerald-500 to-teal-500' },
  medical: { label: 'Medicina', icon: <Stethoscope className="h-4 w-4" />, description: 'PubMed, NCBI y OpenStax', gradient: 'from-pink-500 to-rose-500' },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subject');
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AcademicResource[]>([]);
  const [totalBySource, setTotalBySource] = useState<Record<string, number>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || ''
  );
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [resourceToImport, setResourceToImport] = useState<AcademicResource | null>(null);
  const [viewerResource, setViewerResource] = useState<AcademicResource | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  function handleOpenViewer(resource: AcademicResource) {
    // For videos, open in new tab instead of viewer
    if (resource.type === 'video') {
      window.open(resource.url, '_blank');
      return;
    }
    setViewerResource(resource);
    setIsViewerOpen(true);
  }

  function handleCloseViewer() {
    setIsViewerOpen(false);
    setViewerResource(null);
  }

  const [filters, setFilters] = useState<Partial<AcademicSearchParams>>({
    type: undefined,
    level: undefined,
    language: undefined,
    openAccessOnly: false,
    limit: 30,
  });

  useEffect(() => {
    loadSubjects();
  }, [token]);

  async function loadSubjects() {
    if (!token) return;
    try {
      const data = await subjectsApi.list(token);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const data = await academic.searchAll(token, {
        query: query.trim(),
        category: selectedCategory,
        openAccessOnly: filters.openAccessOnly,
        limit: filters.limit,
      });
      setResults(data.results || []);
      setTotalBySource(data.totalBySource || {});
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
      setTotalBySource({});
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCategoryChange(category: SearchCategory) {
    setSelectedCategory(category);
    if (hasSearched && query.trim() && token) {
      setIsLoading(true);
      try {
        const data = await academic.searchAll(token, {
          query: query.trim(),
          category,
          openAccessOnly: filters.openAccessOnly,
          limit: filters.limit,
        });
        setResults(data.results || []);
        setTotalBySource(data.totalBySource || {});
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleImportClick(resource: AcademicResource) {
    setResourceToImport(resource);
    setIsImportModalOpen(true);
  }

  async function handleImport() {
    if (!token || !resourceToImport || !selectedSubjectId) return;

    setImportingId(resourceToImport.externalId);
    try {
      await academic.importToSubject(token, selectedSubjectId, resourceToImport);
      setImportedIds((prev) => new Set([...prev, resourceToImport.externalId]));
      setIsImportModalOpen(false);
    } catch (error) {
      console.error('Error importing resource:', error);
    } finally {
      setImportingId(null);
      setResourceToImport(null);
    }
  }

  const typeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...Object.entries(resourceTypeLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const levelOptions = [
    { value: '', label: 'Todos los niveles' },
    ...Object.entries(resourceLevelLabels).map(([value, label]) => ({
      value,
      label,
    })),
  ];

  const languageOptions = [
    { value: '', label: 'Todos los idiomas' },
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'pt', label: 'Portugués' },
  ];

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Search className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                Buscar <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Recursos</span>
              </h1>
              <p className="text-secondary-500 mt-0.5">
                Encuentra libros, videos, papers, manuales y cursos de internet
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-4xl">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="relative rounded-2xl border-2 border-secondary-200 bg-white focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all duration-200 overflow-hidden shadow-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Buscar por tema, autor o título..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-secondary-900 placeholder:text-secondary-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'px-4 rounded-xl',
                  showFilters && 'bg-secondary-100 border-secondary-300'
                )}
              >
                <Filter className="h-5 w-5" />
              </Button>
              <Button type="submit" variant="gradient" isLoading={isLoading} className="px-8 rounded-xl shadow-lg shadow-primary-500/25">
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Category Tabs - Premium Style */}
            <div className="flex gap-2 mt-4 pt-4 overflow-x-auto pb-2 custom-scrollbar">
              {(Object.keys(categoryConfig) as SearchCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    selectedCategory === cat
                      ? `bg-gradient-to-r ${categoryConfig[cat].gradient} text-white shadow-lg`
                      : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50 hover:border-secondary-300'
                  )}
                >
                  {categoryConfig[cat].icon}
                  {categoryConfig[cat].label}
                </button>
              ))}
            </div>

            {/* Filters - Animated */}
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-secondary-200 animate-fade-in">
                <Select
                  label="Tipo"
                  options={typeOptions}
                  value={filters.type || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: (e.target.value as ResourceType) || undefined,
                    }))
                  }
                />
                <Select
                  label="Nivel"
                  options={levelOptions}
                  value={filters.level || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      level: (e.target.value as ResourceLevel) || undefined,
                    }))
                  }
                />
                <Select
                  label="Idioma"
                  options={languageOptions}
                  value={filters.language || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      language: e.target.value || undefined,
                    }))
                  }
                />
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-secondary-200 bg-white hover:bg-secondary-50 transition-colors w-full">
                    <input
                      type="checkbox"
                      checked={filters.openAccessOnly}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          openAccessOnly: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-secondary-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-secondary-700 font-medium">
                      Solo Open Access
                    </span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Results Section */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg animate-pulse">
                <Search className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="mt-6 text-secondary-500 font-medium">Buscando recursos...</p>
          </div>
        ) : !hasSearched ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 animate-float">
                <Library className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-3">
              Descubre recursos <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">educativos</span>
            </h3>
            <p className="text-secondary-500 max-w-md mx-auto mb-8">
              Encuentra libros, videos, papers y cursos en YouTube, Google Books, Archive.org, OpenAlex y más
            </p>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {['Inteligencia Artificial', 'Cálculo', 'Programación', 'Historia', 'Biología'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                  }}
                  className="px-4 py-2 rounded-full bg-white border border-secondary-200 text-sm text-secondary-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-secondary-400" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No se encontraron resultados</h3>
            <p className="text-secondary-500 max-w-md mx-auto">
              Intenta con otros términos de búsqueda o cambia de categoría
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Results summary with source breakdown */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-secondary-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-secondary-900">
                  {results.length} resultado{results.length !== 1 && 's'}
                </span>
              </div>
              {Object.keys(totalBySource).length > 0 && (
                <div className="flex flex-wrap gap-2 ml-auto">
                  {Object.entries(totalBySource).map(([source, count]) => (
                    <Badge key={source} variant="default" size="sm" className="bg-secondary-100">
                      {sourceLabels[source as AcademicSource] || source}: {typeof count === 'number' && !isNaN(count) ? count : 0}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Results grid */}
            {selectedCategory === 'videos' || selectedCategory === 'books' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((resource, index) => (
                  <div
                    key={resource.externalId}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ResourceGridCard
                      resource={resource}
                      onImport={() => handleImportClick(resource)}
                      onOpen={() => handleOpenViewer(resource)}
                      isImporting={importingId === resource.externalId}
                      isImported={importedIds.has(resource.externalId)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((resource, index) => (
                  <div
                    key={resource.externalId}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <ResourceResultCard
                      resource={resource}
                      onImport={() => handleImportClick(resource)}
                      onOpen={() => handleOpenViewer(resource)}
                      isImporting={importingId === resource.externalId}
                      isImported={importedIds.has(resource.externalId)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Viewer */}
      {viewerResource && (
        <DocumentViewer
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          title={viewerResource.title}
          url={viewerResource.url || ''}
          pdfUrl={viewerResource.pdfUrl}
          source={viewerResource.source}
          externalId={viewerResource.externalId}
          thumbnailUrl={viewerResource.thumbnailUrl}
          authors={viewerResource.authors}
        />
      )}

      {/* Import Modal - Premium Style */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setResourceToImport(null);
        }}
        title="Guardar recurso"
        description="Selecciona la materia donde quieres guardar este recurso"
        variant="glass"
      >
        {resourceToImport && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-secondary-50 to-primary-50/30 rounded-xl border border-secondary-100">
              <h4 className="font-semibold text-secondary-900 line-clamp-2">
                {resourceToImport.title}
              </h4>
              {resourceToImport.authors.length > 0 && (
                <p className="text-sm text-secondary-500 mt-1 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {resourceToImport.authors.slice(0, 3).join(', ')}
                  {resourceToImport.authors.length > 3 && ' y otros'}
                </p>
              )}
            </div>

            <Select
              label="Materia"
              options={subjectOptions}
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              placeholder="Selecciona una materia"
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
              <Button
                variant="outline"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setResourceToImport(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleImport}
                isLoading={importingId === resourceToImport.externalId}
                disabled={!selectedSubjectId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Source labels for all providers
const sourceLabels: Record<string, string> = {
  openalex: 'OpenAlex',
  semantic_scholar: 'Semantic Scholar',
  crossref: 'CrossRef',
  youtube: 'YouTube',
  google_books: 'Google Books',
  archive_org: 'Archive.org',
  libgen: 'Library Genesis',
  web: 'Web',
  oer_commons: 'OER Commons',
  medical_books: 'Medical Books',
  manual: 'Manual',
};

// Resource type labels
const typeLabels: Record<string, string> = {
  paper: 'Paper',
  book: 'Libro',
  book_chapter: 'Capítulo',
  article: 'Artículo',
  thesis: 'Tesis',
  conference: 'Conferencia',
  preprint: 'Preprint',
  dataset: 'Dataset',
  course: 'Curso',
  video: 'Video',
  manual: 'Manual',
  notes: 'Apuntes',
  report: 'Reporte',
  standard: 'Estándar',
  reference: 'Referencia',
  other: 'Otro',
};

function getResourceIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5" />;
    case 'book':
    case 'book_chapter':
      return <BookMarked className="h-5 w-5" />;
    case 'course':
      return <GraduationCap className="h-5 w-5" />;
    case 'manual':
    case 'notes':
      return <File className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}

function getSourceColor(source: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  switch (source) {
    case 'youtube':
      return 'danger';
    case 'google_books':
      return 'primary';
    case 'archive_org':
      return 'warning';
    case 'libgen':
      return 'success';
    case 'medical_books':
      return 'primary';
    default:
      return 'default';
  }
}

function ResourceGridCard({
  resource,
  onImport,
  onOpen,
  isImporting,
  isImported,
}: {
  resource: AcademicResource;
  onImport: () => void;
  onOpen: () => void;
  isImporting: boolean;
  isImported: boolean;
}) {
  const isVideo = resource.type === 'video';

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-secondary-100" hover>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary-100 to-secondary-200 overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            {isVideo ? <Video className="h-12 w-12" /> : <BookMarked className="h-12 w-12" />}
          </div>
        )}

        {/* Overlay - opens viewer for books, new tab for videos */}
        {resource.url && (
          <button
            onClick={onOpen}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
              {isVideo ? (
                <Play className="h-8 w-8 text-red-500 ml-1" />
              ) : (
                <BookOpen className="h-8 w-8 text-amber-600" />
              )}
            </div>
          </button>
        )}

        {/* Duration badge for videos */}
        {resource.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg font-medium">
            {resource.duration}
          </div>
        )}

        {/* Page count for books */}
        {typeof resource.pageCount === 'number' && !isNaN(resource.pageCount) && resource.pageCount > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg font-medium">
            {resource.pageCount} págs.
          </div>
        )}

        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={getSourceColor(resource.source)} size="sm" className="shadow-sm">
            {sourceLabels[resource.source] || resource.source}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-secondary-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {resource.url ? (
            <button
              onClick={onOpen}
              className="text-left hover:underline w-full"
            >
              {resource.title}
            </button>
          ) : (
            resource.title
          )}
        </h3>

        {/* Authors/Channel */}
        {resource.authors.length > 0 && (
          <p className="text-sm text-secondary-500 mb-3 line-clamp-1 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {resource.authors[0]}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {resource.isOpenAccess && (
            <Badge variant="success" size="sm">
              Gratis
            </Badge>
          )}
          {resource.language && (
            <span className="text-xs text-secondary-400 uppercase">{resource.language}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {resource.url && (
            <Button variant="outline" size="sm" className="flex-1" onClick={onOpen}>
              {isVideo ? <Play className="h-4 w-4 mr-1" /> : <BookOpen className="h-4 w-4 mr-1" />}
              {isVideo ? 'Ver' : 'Leer'}
            </Button>
          )}
          {isImported ? (
            <Button variant="secondary" size="sm" disabled className="bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              Guardado
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={onImport} isLoading={isImporting}>
              <Plus className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceResultCard({
  resource,
  onImport,
  onOpen,
  isImporting,
  isImported,
}: {
  resource: AcademicResource;
  onImport: () => void;
  onOpen: () => void;
  isImporting: boolean;
  isImported: boolean;
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group border-secondary-100" hover>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon or thumbnail */}
          {resource.thumbnailUrl ? (
            <div className="w-20 h-24 bg-secondary-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
              <img src={resource.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
          ) : (
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
              'bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-500'
            )}>
              {getResourceIcon(resource.type)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                  {resource.url ? (
                    <button
                      onClick={onOpen}
                      className="text-left hover:underline"
                    >
                      {resource.title}
                    </button>
                  ) : (
                    resource.title
                  )}
                </h3>

                {resource.authors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-secondary-500 mt-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {resource.authors.slice(0, 3).join(', ')}
                      {resource.authors.length > 3 && ` +${resource.authors.length - 3} más`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm text-secondary-500 mt-2">
                  {(() => {
                    const year = resource.publicationYear ||
                      (resource.publicationDate ? new Date(resource.publicationDate).getFullYear() : null);
                    return typeof year === 'number' && !isNaN(year) && year > 0 ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {year}
                      </span>
                    ) : null;
                  })()}
                  {typeof resource.citationCount === 'number' && !isNaN(resource.citationCount) && resource.citationCount > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      {resource.citationCount} citas
                    </span>
                  )}
                  {resource.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {resource.duration}
                    </span>
                  )}
                  {typeof resource.pageCount === 'number' && !isNaN(resource.pageCount) && resource.pageCount > 0 && (
                    <span>{resource.pageCount} págs.</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {resource.url && (
                  <Button variant="outline" size="sm" onClick={onOpen}>
                    <BookOpen className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
                {isImported ? (
                  <Button variant="secondary" size="sm" disabled className="bg-emerald-50 text-emerald-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Guardado
                  </Button>
                ) : (
                  <Button variant="gradient" size="sm" onClick={onImport} isLoading={isImporting}>
                    <Plus className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                )}
              </div>
            </div>

            {resource.abstract && (
              <p className="text-sm text-secondary-600 mt-3 line-clamp-2 leading-relaxed">{resource.abstract}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="default" size="sm" className="bg-secondary-100">
                {typeLabels[resource.type] || resource.type}
              </Badge>
              <Badge variant={getSourceColor(resource.source)} size="sm">
                {sourceLabels[resource.source] || resource.source}
              </Badge>
              {resource.isOpenAccess && (
                <Badge variant="success" size="sm">
                  Open Access
                </Badge>
              )}
              {resource.extension && (
                <Badge variant="default" size="sm" className="bg-secondary-100 uppercase">
                  {resource.extension}
                </Badge>
              )}
              {resource.pdfUrl && (
                <a
                  href={resource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Download className="h-3 w-3" />
                  PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
