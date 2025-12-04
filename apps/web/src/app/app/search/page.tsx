'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
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
} from 'lucide-react';
import { resourceTypeLabels, resourceLevelLabels } from '@/lib/utils';
import Image from 'next/image';

// Category configuration
const categoryConfig: Record<SearchCategory, { label: string; icon: React.ReactNode; description: string }> = {
  all: { label: 'Todos', icon: <Globe className="h-4 w-4" />, description: 'Buscar en todas las fuentes' },
  papers: { label: 'Papers', icon: <FileText className="h-4 w-4" />, description: 'Artículos científicos' },
  books: { label: 'Libros', icon: <BookMarked className="h-4 w-4" />, description: 'Libros y manuales' },
  videos: { label: 'Videos', icon: <Video className="h-4 w-4" />, description: 'Videos educativos' },
  courses: { label: 'Cursos', icon: <GraduationCap className="h-4 w-4" />, description: 'Cursos y tutoriales' },
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

  const [filters, setFilters] = useState<Partial<AcademicSearchParams>>({
    type: undefined,
    level: undefined,
    language: undefined,
    openAccessOnly: false, // Allow all by default for comprehensive search
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
      // Use unified search for comprehensive results
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

  // Re-search when category changes
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
    <>
      <Header
        title="Buscar Recursos Educativos"
        subtitle="Encuentra libros, videos, papers, manuales y cursos de internet"
      />

      <div className="p-6">
        {/* Search Form */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por tema, autor o título..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  leftIcon={<Filter className="h-4 w-4" />}
                >
                  Filtros
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Buscar
                </Button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 mt-4 pt-4 border-t overflow-x-auto">
                {(Object.keys(categoryConfig) as SearchCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                    }`}
                  >
                    {categoryConfig[cat].icon}
                    {categoryConfig[cat].label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.openAccessOnly}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            openAccessOnly: e.target.checked,
                          }))
                        }
                        className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-secondary-700">
                        Solo Open Access
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : !hasSearched ? (
          <Card>
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Busca recursos educativos"
              description="Encuentra libros, videos, papers y cursos en YouTube, Google Books, Archive.org, OpenAlex y más"
            />
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No se encontraron resultados"
              description="Intenta con otros términos de búsqueda o cambia de categoría"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results summary with source breakdown */}
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm text-secondary-500">
                {results.length} resultado{results.length !== 1 && 's'} encontrado{results.length !== 1 && 's'}
              </p>
              {Object.keys(totalBySource).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(totalBySource).map(([source, count]) => (
                    <Badge key={source} variant="default" size="sm">
                      {sourceLabels[source as AcademicSource] || source}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Results grid - use cards for videos/books, list for papers */}
            {selectedCategory === 'videos' || selectedCategory === 'books' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((resource) => (
                  <ResourceGridCard
                    key={resource.externalId}
                    resource={resource}
                    onImport={() => handleImportClick(resource)}
                    isImporting={importingId === resource.externalId}
                    isImported={importedIds.has(resource.externalId)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((resource) => (
                  <ResourceResultCard
                    key={resource.externalId}
                    resource={resource}
                    onImport={() => handleImportClick(resource)}
                    isImporting={importingId === resource.externalId}
                    isImported={importedIds.has(resource.externalId)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setResourceToImport(null);
        }}
        title="Importar recurso"
        description="Selecciona la materia donde quieres guardar este recurso"
      >
        {resourceToImport && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-lg">
              <h4 className="font-medium text-secondary-900">
                {resourceToImport.title}
              </h4>
              {resourceToImport.authors.length > 0 && (
                <p className="text-sm text-secondary-500 mt-1">
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

            <div className="flex justify-end gap-3 pt-4">
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
                onClick={handleImport}
                isLoading={importingId === resourceToImport.externalId}
                disabled={!selectedSubjectId}
              >
                Importar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
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

// Get icon based on resource type
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

// Get badge color based on source
function getSourceColor(source: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (source) {
    case 'youtube':
      return 'error';
    case 'google_books':
      return 'primary';
    case 'archive_org':
      return 'warning';
    case 'libgen':
      return 'success';
    default:
      return 'default';
  }
}

// Grid card for videos and books (with thumbnails)
function ResourceGridCard({
  resource,
  onImport,
  isImporting,
  isImported,
}: {
  resource: AcademicResource;
  onImport: () => void;
  isImporting: boolean;
  isImported: boolean;
}) {
  const isVideo = resource.type === 'video';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-secondary-100">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            {isVideo ? <Video className="h-12 w-12" /> : <BookMarked className="h-12 w-12" />}
          </div>
        )}

        {/* Video overlay */}
        {isVideo && resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-primary-600 ml-1" />
            </div>
          </a>
        )}

        {/* Duration badge for videos */}
        {resource.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {resource.duration}
          </div>
        )}

        {/* Page count for books */}
        {resource.pageCount && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
            {resource.pageCount} págs.
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-secondary-900 line-clamp-2 mb-2">
          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 hover:underline"
            >
              {resource.title}
            </a>
          ) : (
            resource.title
          )}
        </h3>

        {/* Authors/Channel */}
        {resource.authors.length > 0 && (
          <p className="text-sm text-secondary-500 mb-2 line-clamp-1">
            {resource.authors[0]}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={getSourceColor(resource.source)} size="sm">
            {sourceLabels[resource.source] || resource.source}
          </Badge>
          {resource.isOpenAccess && (
            <Badge variant="success" size="sm">
              Gratis
            </Badge>
          )}
          {resource.language && (
            <span className="text-xs text-secondary-400">{resource.language.toUpperCase()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {resource.url && (
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" size="sm" className="w-full" leftIcon={<ExternalLink className="h-4 w-4" />}>
                {isVideo ? 'Ver' : 'Abrir'}
              </Button>
            </a>
          )}
          {isImported ? (
            <Button variant="secondary" size="sm" leftIcon={<CheckCircle className="h-4 w-4" />} disabled>
              Guardado
            </Button>
          ) : (
            <Button size="sm" onClick={onImport} isLoading={isImporting} leftIcon={<Plus className="h-4 w-4" />}>
              Guardar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// List card for papers and general results
function ResourceResultCard({
  resource,
  onImport,
  isImporting,
  isImported,
}: {
  resource: AcademicResource;
  onImport: () => void;
  isImporting: boolean;
  isImported: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon or thumbnail */}
          {resource.thumbnailUrl ? (
            <div className="w-16 h-20 bg-secondary-100 rounded-lg overflow-hidden flex-shrink-0">
              <img src={resource.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 flex-shrink-0">
              {getResourceIcon(resource.type)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 hover:text-primary-600">
                  {resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {resource.title}
                    </a>
                  ) : (
                    resource.title
                  )}
                </h3>

                {resource.authors.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-secondary-500 mt-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {resource.authors.slice(0, 3).join(', ')}
                      {resource.authors.length > 3 && ` +${resource.authors.length - 3} más`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-secondary-500 mt-1">
                  {(resource.publicationDate || resource.publicationYear) && (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {resource.publicationYear || new Date(resource.publicationDate!).getFullYear()}
                      </span>
                    </>
                  )}
                  {resource.citationCount !== null && resource.citationCount > 0 && (
                    <span>· {resource.citationCount} citas</span>
                  )}
                  {resource.duration && (
                    <>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{resource.duration}</span>
                    </>
                  )}
                  {resource.pageCount && <span>· {resource.pageCount} págs.</span>}
                  {resource.fileSize && <span>· {resource.fileSize}</span>}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {resource.url && (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                      Ver
                    </Button>
                  </a>
                )}
                {isImported ? (
                  <Button variant="secondary" size="sm" leftIcon={<CheckCircle className="h-4 w-4" />} disabled>
                    Importado
                  </Button>
                ) : (
                  <Button size="sm" onClick={onImport} isLoading={isImporting} leftIcon={<Plus className="h-4 w-4" />}>
                    Importar
                  </Button>
                )}
              </div>
            </div>

            {resource.abstract && (
              <p className="text-sm text-secondary-600 mt-3 line-clamp-3">{resource.abstract}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="default" size="sm">
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
                <Badge variant="default" size="sm">
                  {resource.extension.toUpperCase()}
                </Badge>
              )}
              {resource.pdfUrl && (
                <a
                  href={resource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
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
