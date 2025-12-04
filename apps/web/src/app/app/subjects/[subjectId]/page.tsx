'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Badge,
  EmptyState,
  Spinner,
} from '@/components/ui';
import { HarvardSummaryView } from '@/components/features/harvard-summary';
import {
  subjects as subjectsApi,
  resources as resourcesApi,
  Subject,
  Resource,
  CreateResourceRequest,
  ResourceType,
  ResourceLevel,
} from '@/lib/api';
import {
  ArrowLeft,
  Plus,
  Search,
  ExternalLink,
  FileText,
  Video,
  BookOpen,
  GraduationCap,
  FileQuestion,
  MoreVertical,
  Pencil,
  Trash2,
  Sparkles,
  MessageSquare,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  resourceTypeLabels,
  resourceLevelLabels,
  getContrastColor,
  formatDate,
} from '@/lib/utils';

const resourceTypeIcons: Record<ResourceType, React.ReactNode> = {
  BOOK: <BookOpen className="h-5 w-5" />,
  PAPER: <FileText className="h-5 w-5" />,
  ARTICLE: <FileText className="h-5 w-5" />,
  VIDEO: <Video className="h-5 w-5" />,
  COURSE: <GraduationCap className="h-5 w-5" />,
  MANUAL: <FileText className="h-5 w-5" />,
  NOTES: <FileText className="h-5 w-5" />,
  OTHER: <FileQuestion className="h-5 w-5" />,
};

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newResource, setNewResource] = useState<CreateResourceRequest>({
    subjectId: subjectId,
    title: '',
    authors: [],
    description: '',
    url: '',
    type: 'BOOK',
    level: 'INTERMEDIATE',
    language: 'es',
    isOpenAccess: true,
  });

  useEffect(() => {
    loadData();
  }, [token, subjectId]);

  async function loadData() {
    if (!token) return;
    setIsLoading(true);
    try {
      const [subjectData, resourcesData] = await Promise.all([
        subjectsApi.get(token, subjectId),
        resourcesApi.listBySubject(token, subjectId),
      ]);
      setSubject(subjectData);
      setResources(resourcesData);
    } catch (error) {
      console.error('Error loading subject:', error);
      router.push('/app/subjects');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateResource(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newResource.title.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await resourcesApi.create(token, {
        ...newResource,
        subjectId,
        authors: newResource.authors?.filter(Boolean) || [],
      });
      setResources((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewResource({
        subjectId,
        title: '',
        authors: [],
        description: '',
        url: '',
        type: 'BOOK',
        level: 'INTERMEDIATE',
        language: 'es',
        isOpenAccess: true,
      });
    } catch (error) {
      console.error('Error creating resource:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteResource(id: string) {
    if (!token || !confirm('¿Estás seguro de eliminar este recurso?')) return;

    try {
      await resourcesApi.delete(token, id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  }

  async function handleIndexResource(id: string) {
    if (!token) return;

    try {
      await resourcesApi.index(token, id);
      // Reload to get updated status
      const updated = await resourcesApi.get(token, id);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (error) {
      console.error('Error indexing resource:', error);
    }
  }

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeOptions = Object.entries(resourceTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const levelOptions = Object.entries(resourceLevelLabels).map(([value, label]) => ({
    value,
    label,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!subject) {
    return null;
  }

  return (
    <>
      <Header
        title={subject.name}
        subtitle={[subject.career, subject.year ? `${subject.year}° año` : null]
          .filter(Boolean)
          .join(' · ')}
      />

      <div className="p-6">
        {/* Back Link & Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/app/subjects"
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a materias
          </Link>

          <div className="flex gap-2">
            <Link href={`/app/copilot?subject=${subjectId}`}>
              <Button
                variant="outline"
                leftIcon={<MessageSquare className="h-4 w-4" />}
              >
                Preguntar al copiloto
              </Button>
            </Link>
            <Link href={`/app/search?subject=${subjectId}`}>
              <Button
                variant="outline"
                leftIcon={<Search className="h-4 w-4" />}
              >
                Buscar recursos
              </Button>
            </Link>
          </div>
        </div>

        {/* Subject Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{
                  backgroundColor: subject.color,
                  color: getContrastColor(subject.color),
                }}
              >
                {subject.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-secondary-900">
                  {subject.name}
                </h2>
                {subject.description && (
                  <p className="text-secondary-600 mt-1">{subject.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {subject.career && (
                    <Badge variant="primary">{subject.career}</Badge>
                  )}
                  {subject.year && (
                    <Badge variant="default">{subject.year}° año</Badge>
                  )}
                  {subject.semester && (
                    <Badge variant="default">
                      {subject.semester === 'anual'
                        ? 'Anual'
                        : `${subject.semester}° cuatrimestre`}
                    </Badge>
                  )}
                  <Badge variant="info">
                    {resources.length} recursos
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <CardTitle>Recursos</CardTitle>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Agregar recurso
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar recurso..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-5 w-5" />}
                />
              </div>
              <Select
                options={[{ value: '', label: 'Todos los tipos' }, ...typeOptions]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-48"
              />
            </div>

            {/* Resources List */}
            {filteredResources.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title={
                  searchQuery || typeFilter
                    ? 'No se encontraron recursos'
                    : 'No hay recursos aún'
                }
                description={
                  searchQuery || typeFilter
                    ? 'Intenta con otros filtros'
                    : 'Agrega tu primer recurso para empezar a estudiar'
                }
                action={
                  !searchQuery &&
                  !typeFilter && (
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Agregar recurso
                    </Button>
                  )
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onDelete={() => handleDeleteResource(resource.id)}
                    onIndex={() => handleIndexResource(resource.id)}
                    token={token!}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Resource Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Agregar recurso"
        description="Agrega un libro, paper, video o cualquier material de estudio"
        size="lg"
      >
        <form onSubmit={handleCreateResource} className="space-y-4">
          <Input
            label="Título"
            placeholder="Ej: Cálculo de una variable - Stewart"
            value={newResource.title}
            onChange={(e) =>
              setNewResource((prev) => ({ ...prev, title: e.target.value }))
            }
            required
          />

          <Input
            label="Autores (separados por coma)"
            placeholder="Ej: James Stewart, Daniel Clegg"
            value={newResource.authors?.join(', ') || ''}
            onChange={(e) =>
              setNewResource((prev) => ({
                ...prev,
                authors: e.target.value.split(',').map((a) => a.trim()),
              }))
            }
          />

          <Textarea
            label="Descripción / Abstract"
            placeholder="Descripción breve del contenido..."
            value={newResource.description}
            onChange={(e) =>
              setNewResource((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />

          <Input
            label="URL (opcional)"
            placeholder="https://..."
            value={newResource.url}
            onChange={(e) =>
              setNewResource((prev) => ({ ...prev, url: e.target.value }))
            }
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Tipo"
              options={typeOptions}
              value={newResource.type}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  type: e.target.value as ResourceType,
                }))
              }
            />
            <Select
              label="Nivel"
              options={levelOptions}
              value={newResource.level}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  level: e.target.value as ResourceLevel,
                }))
              }
            />
            <Select
              label="Idioma"
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'Inglés' },
                { value: 'pt', label: 'Portugués' },
              ]}
              value={newResource.language}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  language: e.target.value,
                }))
              }
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newResource.isOpenAccess}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  isOpenAccess: e.target.checked,
                }))
              }
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700">
              Es de acceso abierto (Open Access)
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Agregar recurso
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function ResourceCard({
  resource,
  onDelete,
  onIndex,
  token,
}: {
  resource: Resource;
  onDelete: () => void;
  onIndex: () => void;
  token: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleIndex = async () => {
    setIsIndexing(true);
    await onIndex();
    setIsIndexing(false);
    setShowMenu(false);
  };

  return (
    <div className="rounded-lg border border-secondary-200 hover:border-secondary-300 transition-colors overflow-hidden">
      <div className="flex items-start gap-4 p-4">
        <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center text-secondary-600">
          {resourceTypeIcons[resource.type]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-secondary-900">{resource.title}</h3>
              {resource.authors.length > 0 && (
                <p className="text-sm text-secondary-500">
                  {resource.authors.join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Expand/Collapse button for Harvard Summary */}
              {resource.isIndexed && (
                <button
                  className="p-1 rounded-lg text-primary-500 hover:text-primary-700 hover:bg-primary-50"
                  onClick={() => setIsExpanded(!isExpanded)}
                  title="Ver resumen Harvard"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </button>
              )}
              <div className="relative">
                <button
                  className="p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-20">
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Abrir enlace
                        </a>
                      )}
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={handleIndex}
                        disabled={isIndexing}
                      >
                        <Sparkles className="h-4 w-4" />
                        {isIndexing
                          ? 'Indexando...'
                          : resource.isIndexed
                          ? 'Reindexar para RAG'
                          : 'Indexar para RAG'}
                      </button>
                      {resource.isIndexed && (
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          onClick={() => {
                            setIsExpanded(true);
                            setShowMenu(false);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Generar resumen Harvard
                        </button>
                      )}
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          onDelete();
                          setShowMenu(false);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {resource.description && (
            <p className="text-sm text-secondary-600 mt-2 line-clamp-2">
              {resource.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="default" size="sm">
              {resourceTypeLabels[resource.type]}
            </Badge>
            <Badge variant="default" size="sm">
              {resourceLevelLabels[resource.level]}
            </Badge>
            {resource.isOpenAccess && (
              <Badge variant="success" size="sm">
                Open Access
              </Badge>
            )}
            {resource.isIndexed && (
              <Badge variant="primary" size="sm">
                Indexado ({resource.chunkCount} chunks)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Harvard Summary Section */}
      {isExpanded && (
        <div className="border-t border-secondary-200 p-4 bg-secondary-50/50">
          <HarvardSummaryView
            resourceId={resource.id}
            resourceTitle={resource.title}
            token={token}
            isIndexed={resource.isIndexed}
          />
        </div>
      )}
    </div>
  );
}
