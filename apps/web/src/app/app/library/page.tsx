'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Modal,
  Select,
  DocumentViewer,
} from '@/components/ui';
import {
  academic,
  subjects as subjectsApi,
  AcademicResource,
  Subject,
  Career,
} from '@/lib/api';
import {
  Library,
  BookOpen,
  Download,
  Users,
  BookMarked,
  Plus,
  CheckCircle,
  Search,
  Star,
  ArrowRight,
  GraduationCap,
  Stethoscope,
  Activity,
  Heart,
  Brain,
  Scale,
  Code,
  Calculator,
  Building,
  Briefcase,
  HardHat,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Icon mapping for careers
const careerIcons: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  Code: <Code className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  Building: <Building className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  HardHat: <HardHat className="h-5 w-5" />,
};

export default function LibraryPage() {
  const { token } = useAuth();
  const [textbooks, setTextbooks] = useState<AcademicResource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCareer, setSelectedCareer] = useState<string>('kinesiology');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [resourceToImport, setResourceToImport] = useState<AcademicResource | null>(null);
  const [stats, setStats] = useState<{ totalBooks: number; totalCareers: number } | null>(null);
  const [viewerResource, setViewerResource] = useState<AcademicResource | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  function handleOpenViewer(resource: AcademicResource) {
    setViewerResource(resource);
    setIsViewerOpen(true);
  }

  function handleCloseViewer() {
    setIsViewerOpen(false);
    setViewerResource(null);
  }

  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedCareer) {
      loadTextbooks();
    }
  }, [token, selectedCareer]);

  async function loadInitialData() {
    if (!token) return;
    try {
      const [careersData, subjectData, statsData] = await Promise.all([
        academic.getCareers(token),
        subjectsApi.list(token),
        academic.getLibraryStats(token),
      ]);
      setCareers(careersData.careers || []);
      setSubjects(subjectData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async function loadTextbooks() {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await academic.getTextbooksForCareer(token, selectedCareer);
      setTextbooks(data.textbooks || []);
    } catch (error) {
      console.error('Error loading textbooks:', error);
      setTextbooks([]);
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

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const currentCareer = careers.find(c => c.id === selectedCareer);

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-500/10 to-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Library className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Biblioteca</span> Académica
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Libros de texto gratuitos por carrera
                </p>
              </div>
            </div>
            {stats && (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalBooks}</p>
                  <p className="text-xs text-secondary-500">Libros disponibles</p>
                </div>
                <div className="w-px h-10 bg-secondary-200" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalCareers}</p>
                  <p className="text-xs text-secondary-500">Carreras</p>
                </div>
              </div>
            )}
          </div>

          {/* Career Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {careers.map((career) => (
              <button
                key={career.id}
                onClick={() => setSelectedCareer(career.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  selectedCareer === career.id
                    ? `bg-gradient-to-r ${career.gradient} text-white shadow-lg`
                    : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50 hover:border-secondary-300'
                )}
              >
                {careerIcons[career.icon] || <GraduationCap className="h-4 w-4" />}
                {career.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
                <Library className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="mt-6 text-secondary-500 font-medium">Cargando biblioteca...</p>
          </div>
        ) : textbooks.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-secondary-400" />
            </div>
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No hay libros para esta carrera</h3>
            <p className="text-secondary-500 max-w-md mx-auto">
              Prueba seleccionando otra carrera
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white',
                  `bg-gradient-to-br ${currentCareer?.gradient || 'from-amber-500 to-orange-500'}`
                )}>
                  {currentCareer && careerIcons[currentCareer.icon] || <BookMarked className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    {currentCareer?.name || 'Libros'}
                  </h2>
                  <p className="text-sm text-secondary-500">
                    {currentCareer?.description}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-secondary-100">
                {textbooks.length} libro{textbooks.length !== 1 && 's'}
              </Badge>
            </div>

            {/* Smart Recommendation Banner */}
            {subjects.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-secondary-900">Recomendaciones inteligentes</h4>
                    <p className="text-sm text-secondary-500">
                      Los libros se recomiendan automáticamente según el nombre de tus materias
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-secondary-400" />
                </div>
              </div>
            )}

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {textbooks.map((book, index) => (
                <div
                  key={book.externalId}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <BookCard
                    book={book}
                    onImport={() => handleImportClick(book)}
                    onOpen={() => handleOpenViewer(book)}
                    isImporting={importingId === book.externalId}
                    isImported={importedIds.has(book.externalId)}
                  />
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-12 p-6 bg-gradient-to-r from-secondary-50 to-primary-50/30 rounded-2xl border border-secondary-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                    <Search className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">¿Buscas más recursos?</h3>
                    <p className="text-sm text-secondary-500">Explora videos, papers, cursos y más en la búsqueda académica</p>
                  </div>
                </div>
                <Link href="/app/search">
                  <Button variant="gradient">
                    Ir a Búsqueda
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
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

      {/* Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setResourceToImport(null);
        }}
        title="Guardar libro"
        description="Selecciona la materia donde quieres guardar este libro"
        variant="glass"
      >
        {resourceToImport && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/30 rounded-xl border border-amber-100">
              <div className="flex items-start gap-4">
                {resourceToImport.thumbnailUrl && (
                  <img
                    src={resourceToImport.thumbnailUrl}
                    alt={resourceToImport.title}
                    className="w-16 h-20 object-cover rounded-lg shadow-md"
                  />
                )}
                <div>
                  <h4 className="font-semibold text-secondary-900 line-clamp-2">
                    {resourceToImport.title}
                  </h4>
                  {resourceToImport.authors.length > 0 && (
                    <p className="text-sm text-secondary-500 mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {resourceToImport.authors.slice(0, 2).join(', ')}
                    </p>
                  )}
                </div>
              </div>
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

function BookCard({
  book,
  onImport,
  onOpen,
  isImporting,
  isImported,
}: {
  book: AcademicResource;
  onImport: () => void;
  onOpen: () => void;
  isImporting: boolean;
  isImported: boolean;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-secondary-100 h-full flex flex-col" hover>
      {/* Book Cover */}
      <div className="relative aspect-[3/4] bg-gradient-to-br from-secondary-100 to-secondary-200 overflow-hidden">
        {book.thumbnailUrl ? (
          <img
            src={book.thumbnailUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary-400">
            <BookMarked className="h-16 w-16" />
          </div>
        )}

        {/* Overlay on hover - opens in-app viewer */}
        {book.url && (
          <button
            onClick={onOpen}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <BookOpen className="h-7 w-7 text-amber-600" />
            </div>
          </button>
        )}

        {/* Language badge */}
        {book.language && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" size="sm" className="bg-black/60 text-white uppercase">
              {book.language}
            </Badge>
          </div>
        )}

        {/* Free badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="success" size="sm" className="shadow-sm">
            Gratis
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-semibold text-secondary-900 line-clamp-2 mb-2 group-hover:text-amber-600 transition-colors text-sm">
          {book.url ? (
            <button
              onClick={onOpen}
              className="text-left hover:underline w-full"
            >
              {book.title}
            </button>
          ) : (
            book.title
          )}
        </h3>

        {/* Authors */}
        {book.authors.length > 0 && (
          <p className="text-xs text-secondary-500 mb-3 line-clamp-1 flex items-center gap-1">
            <Users className="h-3 w-3 flex-shrink-0" />
            {book.authors.slice(0, 2).join(', ')}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {/* Read button - opens in-app viewer */}
          <Button variant="outline" size="sm" onClick={onOpen} className="flex-1">
            <BookOpen className="h-4 w-4 mr-1" />
            Leer
          </Button>
          {isImported ? (
            <Button variant="secondary" size="sm" disabled className="bg-emerald-50 text-emerald-600 flex-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Guardado
            </Button>
          ) : (
            <Button variant="gradient" size="sm" onClick={onImport} isLoading={isImporting} className="flex-1">
              <Plus className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
