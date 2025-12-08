'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
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
import { NotebookPanel } from '@/components/features/notebook-panel';
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
  BookOpenCheck,
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
  Zap,
  Calendar,
  Users,
  Globe,
  Library,
  Brain,
  Filter,
  Headphones,
} from 'lucide-react';
import {
  resourceTypeLabels,
  resourceLevelLabels,
  getContrastColor,
  formatDate,
  cn,
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

const resourceTypeGradients: Record<ResourceType, string> = {
  BOOK: 'from-violet-500 to-purple-500',
  PAPER: 'from-blue-500 to-cyan-500',
  ARTICLE: 'from-emerald-500 to-teal-500',
  VIDEO: 'from-red-500 to-rose-500',
  COURSE: 'from-amber-500 to-orange-500',
  MANUAL: 'from-slate-500 to-zinc-500',
  NOTES: 'from-pink-500 to-rose-500',
  OTHER: 'from-secondary-500 to-secondary-600',
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
      const created = await resourcesApi.create(token, subjectId, {
        ...newResource,
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
      await resourcesApi.delete(token, subjectId, id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  }

  async function handleIndexResource(id: string) {
    if (!token) return;

    try {
      await resourcesApi.index(token, id);
      const updated = await resourcesApi.get(token, subjectId, id);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="mt-6 text-secondary-500 font-medium">Cargando materia...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return null;
  }

  const indexedCount = resources.filter(r => r.isIndexed).length;
  const totalChunks = resources.reduce((sum, r) => sum + (r.chunkCount || 0), 0);

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50" style={{ backgroundColor: `${subject.color}10` }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          style={{ backgroundColor: `${subject.color}15` }}
        />

        <div className="relative p-6">
          {/* Back link */}
          <Link
            href="/app/subjects"
            className="inline-flex items-center gap-2 text-sm text-secondary-500 hover:text-secondary-700 mb-4 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver a materias
          </Link>

          <div className="flex items-start gap-5">
            {/* Subject Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 shadow-xl transition-transform duration-300 hover:scale-105"
              style={{
                backgroundColor: subject.color,
                color: getContrastColor(subject.color),
                boxShadow: `0 20px 40px -12px ${subject.color}60`,
              }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-secondary-900 tracking-tight">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="text-secondary-500 mt-1.5 max-w-2xl">{subject.description}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {subject.career && (
                  <Badge variant="gradient" className="shadow-sm">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {subject.career}
                  </Badge>
                )}
                {subject.year && (
                  <Badge variant="default" className="bg-white/80">
                    <Calendar className="h-3 w-3 mr-1" />
                    {subject.year}° año
                  </Badge>
                )}
                {subject.semester && (
                  <Badge variant="default" className="bg-white/80">
                    {subject.semester === 'anual'
                      ? 'Anual'
                      : `${subject.semester}° cuatrimestre`}
                  </Badge>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Library className="h-4 w-4 text-secondary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">{resources.length}</p>
                    <p className="text-xs text-secondary-500">recursos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                    <Brain className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">{indexedCount}</p>
                    <p className="text-xs text-secondary-500">indexados</p>
                  </div>
                </div>
                {totalChunks > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                      <Zap className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-secondary-900">{totalChunks}</p>
                      <p className="text-xs text-secondary-500">chunks</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href={`/app/copilot?subject=${subjectId}`}>
              <Button
                variant="gradient"
                className="shadow-lg shadow-primary-500/25"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Preguntar al copiloto
              </Button>
            </Link>
            <Link href={`/app/search?subject=${subjectId}`}>
              <Button variant="outline" className="bg-white/80 hover:bg-white">
                <Search className="h-4 w-4 mr-2" />
                Buscar recursos
              </Button>
            </Link>
            <Button
              variant="outline"
              className="bg-white/80 hover:bg-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar recurso
            </Button>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="p-6">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="relative rounded-xl border-2 border-secondary-200 bg-white focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-500/10 transition-all duration-200 overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Buscar recurso..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <Select
            options={[{ value: '', label: 'Todos los tipos' }, ...typeOptions]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        {/* Resources List */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-float">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-3">
              {searchQuery || typeFilter
                ? 'No se encontraron recursos'
                : 'No hay recursos aún'}
            </h3>
            <p className="text-secondary-500 max-w-md mx-auto mb-8">
              {searchQuery || typeFilter
                ? 'Intenta con otros filtros'
                : 'Agrega tu primer recurso para empezar a estudiar con tu copiloto IA'}
            </p>
            {!searchQuery && !typeFilter && (
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  variant="gradient"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="shadow-lg shadow-primary-500/25"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar recurso manual
                </Button>
                <Link href={`/app/search?subject=${subjectId}`}>
                  <Button variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar en internet
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource, index) => (
              <div
                key={resource.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ResourceCard
                  resource={resource}
                  onDelete={() => handleDeleteResource(resource.id)}
                  onIndex={() => handleIndexResource(resource.id)}
                  token={token!}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Resource Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Agregar recurso"
        description="Agrega un libro, paper, video o cualquier material de estudio"
        size="lg"
        variant="glass"
      >
        <form onSubmit={handleCreateResource} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              placeholder="Ej: Cálculo de una variable - Stewart"
              value={newResource.title}
              onChange={(e) =>
                setNewResource((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Autores (separados por coma)
            </label>
            <input
              type="text"
              placeholder="Ej: James Stewart, Daniel Clegg"
              value={newResource.authors?.join(', ') || ''}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  authors: e.target.value.split(',').map((a) => a.trim()),
                }))
              }
              className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Descripción / Abstract
            </label>
            <textarea
              placeholder="Descripción breve del contenido..."
              value={newResource.description}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              URL (opcional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={newResource.url}
              onChange={(e) =>
                setNewResource((prev) => ({ ...prev, url: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 outline-none"
            />
          </div>

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

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors">
            <input
              type="checkbox"
              checked={newResource.isOpenAccess}
              onChange={(e) =>
                setNewResource((prev) => ({
                  ...prev,
                  isOpenAccess: e.target.checked,
                }))
              }
              className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700 font-medium">
              Es de acceso abierto (Open Access)
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" isLoading={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar recurso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
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
  const [showNotebook, setShowNotebook] = useState(false);

  const handleIndex = async () => {
    setIsIndexing(true);
    await onIndex();
    setIsIndexing(false);
    setShowMenu(false);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-secondary-100" hover>
      {/* Color accent bar */}
      <div className={cn('h-1 bg-gradient-to-r', resourceTypeGradients[resource.type])} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Type Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-105',
              `bg-gradient-to-br ${resourceTypeGradients[resource.type]}`
            )}
          >
            {resourceTypeIcons[resource.type]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
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
                  <p className="text-sm text-secondary-500 mt-0.5 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {resource.authors.join(', ')}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Notebook button - siempre visible */}
                <button
                  className={cn(
                    'p-2 rounded-xl transition-all duration-200',
                    showNotebook
                      ? 'bg-violet-100 text-violet-600'
                      : resource.isIndexed
                        ? 'text-secondary-400 hover:text-violet-600 hover:bg-violet-50'
                        : 'text-secondary-300 hover:text-violet-400 hover:bg-violet-50/50'
                  )}
                  onClick={() => {
                    setShowNotebook(!showNotebook);
                    if (!showNotebook) setIsExpanded(false);
                  }}
                  title={resource.isIndexed ? "Abrir Notebook de estudio" : "Indexa el recurso primero para usar el Notebook"}
                >
                  <BookOpenCheck className="h-5 w-5" />
                </button>
                {resource.isIndexed && (
                  <button
                    className={cn(
                      'p-2 rounded-xl transition-all duration-200',
                      isExpanded
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-secondary-400 hover:text-primary-600 hover:bg-primary-50'
                    )}
                    onClick={() => {
                      setIsExpanded(!isExpanded);
                      if (!isExpanded) setShowNotebook(false);
                    }}
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
                    className={cn(
                      'p-2 rounded-xl transition-all duration-200',
                      'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100',
                      showMenu && 'bg-secondary-100 text-secondary-600'
                    )}
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
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-secondary-100 py-2 z-20 animate-fade-in overflow-hidden">
                        {resource.url && (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Abrir enlace
                          </a>
                        )}
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors disabled:opacity-50"
                          onClick={handleIndex}
                          disabled={isIndexing}
                        >
                          <Brain className="h-4 w-4" />
                          {isIndexing
                            ? 'Indexando...'
                            : resource.isIndexed
                            ? 'Reindexar para RAG'
                            : 'Indexar para RAG'}
                        </button>
                        {resource.isIndexed && (
                          <>
                            <button
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                              onClick={() => {
                                setShowNotebook(true);
                                setIsExpanded(false);
                                setShowMenu(false);
                              }}
                            >
                              <BookOpenCheck className="h-4 w-4" />
                              Abrir Notebook
                            </button>
                            <button
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                              onClick={() => {
                                setIsExpanded(true);
                                setShowNotebook(false);
                                setShowMenu(false);
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                              Generar resumen Harvard
                            </button>
                          </>
                        )}
                        <div className="my-1 border-t border-secondary-100" />
                        <button
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
              <p className="text-sm text-secondary-600 mt-2 line-clamp-2 leading-relaxed">
                {resource.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Badge variant="default" size="sm" className="bg-secondary-100">
                {resourceTypeLabels[resource.type]}
              </Badge>
              <Badge variant="default" size="sm" className="bg-secondary-100">
                {resourceLevelLabels[resource.level]}
              </Badge>
              {resource.isOpenAccess && (
                <Badge variant="success" size="sm">
                  Open Access
                </Badge>
              )}
              {resource.isIndexed && (
                <Badge variant="gradient" size="sm">
                  <Brain className="h-3 w-3 mr-1" />
                  {resource.chunkCount} chunks
                </Badge>
              )}
              {resource.language && (
                <Badge variant="default" size="sm" className="bg-secondary-100 uppercase">
                  <Globe className="h-3 w-3 mr-1" />
                  {resource.language}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Harvard Summary Section */}
      {isExpanded && (
        <div className="border-t border-secondary-100 p-5 bg-gradient-to-b from-secondary-50/50 to-white animate-fade-in">
          <HarvardSummaryView
            resourceId={resource.id}
            resourceTitle={resource.title}
            token={token}
            isIndexed={resource.isIndexed}
          />
        </div>
      )}

      {/* Notebook Panel Section */}
      {showNotebook && (
        <div className="border-t border-secondary-100 animate-fade-in">
          {resource.isIndexed ? (
            <NotebookPanel
              resource={resource}
              token={token}
            />
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                <BookOpenCheck className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                Notebook de Estudio
              </h3>
              <p className="text-secondary-500 mb-6 max-w-md mx-auto">
                Para usar el Notebook necesitas indexar primero el recurso.
                El proceso de indexado permite que la IA analice el contenido y genere
                preguntas, flashcards y podcasts personalizados.
              </p>
              <button
                onClick={() => {
                  setShowNotebook(false);
                  onIndex();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25"
              >
                <Brain className="h-4 w-4" />
                Indexar recurso
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
