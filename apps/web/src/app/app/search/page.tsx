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
  Subject,
  ResourceType,
  ResourceLevel,
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
} from 'lucide-react';
import { resourceTypeLabels, resourceLevelLabels } from '@/lib/utils';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialSubjectId = searchParams.get('subject');
  const { token } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AcademicResource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    openAccessOnly: true,
    limit: 20,
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
      const data = await academic.search(token, {
        query: query.trim(),
        ...filters,
      });
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
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
        title="Buscar Recursos Académicos"
        subtitle="Encuentra papers, libros y más en fuentes abiertas"
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
              title="Busca recursos académicos"
              description="Encuentra papers, libros y materiales de estudio en OpenAlex, Semantic Scholar y otras fuentes abiertas"
            />
          </Card>
        ) : results.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No se encontraron resultados"
              description="Intenta con otros términos de búsqueda o ajusta los filtros"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-secondary-500">
              {results.length} resultado{results.length !== 1 && 's'} encontrado
              {results.length !== 1 && 's'}
            </p>
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
  const sourceLabels: Record<string, string> = {
    openalex: 'OpenAlex',
    semantic_scholar: 'Semantic Scholar',
    crossref: 'CrossRef',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center text-secondary-600 flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
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
                      {resource.authors.length > 3 &&
                        ` +${resource.authors.length - 3} más`}
                    </span>
                  </div>
                )}

                {resource.publicationDate && (
                  <div className="flex items-center gap-1 text-sm text-secondary-500 mt-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(resource.publicationDate).getFullYear()}
                    </span>
                    {resource.citationCount !== null && (
                      <span className="ml-2">
                        · {resource.citationCount} citas
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<ExternalLink className="h-4 w-4" />}
                    >
                      Ver
                    </Button>
                  </a>
                )}
                {isImported ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    disabled
                  >
                    Importado
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onImport}
                    isLoading={isImporting}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Importar
                  </Button>
                )}
              </div>
            </div>

            {resource.abstract && (
              <p className="text-sm text-secondary-600 mt-3 line-clamp-3">
                {resource.abstract}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="default" size="sm">
                {resourceTypeLabels[resource.type] || resource.type}
              </Badge>
              <Badge variant="default" size="sm">
                {sourceLabels[resource.source] || resource.source}
              </Badge>
              {resource.isOpenAccess && (
                <Badge variant="success" size="sm">
                  Open Access
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
