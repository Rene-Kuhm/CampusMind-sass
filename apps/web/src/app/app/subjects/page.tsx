'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  Spinner,
  Badge,
} from '@/components/ui';
import {
  subjects as subjectsApi,
  Subject,
  CreateSubjectRequest,
} from '@/lib/api';
import {
  BookOpen,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  ArrowRight,
  Sparkles,
  FolderOpen,
  GraduationCap,
  Calendar,
  FileText,
  Zap,
  Palette,
} from 'lucide-react';
import { getContrastColor, subjectColors, cn } from '@/lib/utils';

export default function SubjectsPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSubject, setNewSubject] = useState<CreateSubjectRequest>({
    name: '',
    description: '',
    career: '',
    year: undefined,
    semester: '',
    color: subjectColors[0],
  });

  useEffect(() => {
    loadSubjects();
  }, [token, showArchived]);

  async function loadSubjects() {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await subjectsApi.list(token, showArchived);
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newSubject.name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await subjectsApi.create(token, {
        ...newSubject,
        year: newSubject.year || undefined,
      });
      setSubjects((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewSubject({
        name: '',
        description: '',
        career: '',
        year: undefined,
        semester: '',
        color: subjectColors[0],
      });
    } catch (error) {
      console.error('Error creating subject:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSubject(id: string) {
    if (!token || !confirm('¿Estás seguro de eliminar esta materia?')) return;

    try {
      await subjectsApi.delete(token, id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  }

  async function handleArchiveSubject(id: string) {
    if (!token) return;

    try {
      const subject = subjects.find((s) => s.id === id);
      if (!subject) return;

      await subjectsApi.update(token, id, { isArchived: !subject.isArchived });
      loadSubjects();
    } catch (error) {
      console.error('Error archiving subject:', error);
    }
  }

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const yearOptions = [
    { value: '1', label: '1er año' },
    { value: '2', label: '2do año' },
    { value: '3', label: '3er año' },
    { value: '4', label: '4to año' },
    { value: '5', label: '5to año' },
    { value: '6', label: '6to año o más' },
  ];

  const semesterOptions = [
    { value: '1', label: '1er cuatrimestre' },
    { value: '2', label: '2do cuatrimestre' },
    { value: 'anual', label: 'Anual' },
  ];

  return (
    <div className="min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-violet-50/80 via-white to-purple-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full border-2 border-white flex items-center justify-center">
                  <FolderOpen className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  Mis <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Materias</span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Organiza tus recursos por materia
                </p>
              </div>
            </div>

            <Button
              variant="gradient"
              onClick={() => setIsCreateModalOpen(true)}
              className="shadow-lg shadow-primary-500/25"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva materia
            </Button>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="relative rounded-xl border-2 border-secondary-200 bg-white focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-200 overflow-hidden">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Buscar materia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-secondary-900 placeholder:text-secondary-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                'px-4',
                showArchived && 'bg-violet-100 border-violet-300 text-violet-700'
              )}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Mostrando archivadas' : 'Ver archivadas'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
            </div>
            <p className="mt-6 text-secondary-500 font-medium">Cargando materias...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-violet-500/30 animate-float">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-3">
              {searchQuery ? 'No se encontraron materias' : 'Crea tu primera materia'}
            </h3>
            <p className="text-secondary-500 max-w-md mx-auto mb-8">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Organiza tus recursos de estudio creando una materia para cada curso'}
            </p>
            {!searchQuery && (
              <Button
                variant="gradient"
                onClick={() => setIsCreateModalOpen(true)}
                className="shadow-lg shadow-primary-500/25"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear primera materia
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject, index) => (
              <div
                key={subject.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <SubjectCard
                  subject={subject}
                  onDelete={() => handleDeleteSubject(subject.id)}
                  onArchive={() => handleArchiveSubject(subject.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal - Premium Style */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva materia"
        description="Crea un espacio para organizar los recursos de esta materia"
        variant="glass"
        size="lg"
      >
        <form onSubmit={handleCreateSubject} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Nombre de la materia *
              </label>
              <input
                type="text"
                placeholder="Ej: Análisis Matemático I"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                placeholder="Descripción breve de la materia"
                value={newSubject.description}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Carrera
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ingeniería"
                  value={newSubject.career}
                  onChange={(e) =>
                    setNewSubject((prev) => ({ ...prev, career: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-secondary-200 focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10 transition-all duration-200 outline-none"
                />
              </div>
              <Select
                label="Año"
                options={yearOptions}
                placeholder="Seleccionar"
                value={newSubject.year?.toString() || ''}
                onChange={(e) =>
                  setNewSubject((prev) => ({
                    ...prev,
                    year: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
              />
            </div>

            <Select
              label="Cuatrimestre"
              options={semesterOptions}
              placeholder="Seleccionar"
              value={newSubject.semester || ''}
              onChange={(e) =>
                setNewSubject((prev) => ({ ...prev, semester: e.target.value }))
              }
            />

            {/* Color Picker - Premium Style */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3 flex items-center gap-2">
                <Palette className="h-4 w-4 text-violet-500" />
                Color de la materia
              </label>
              <div className="flex gap-3 flex-wrap p-4 bg-secondary-50 rounded-xl">
                {subjectColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'w-10 h-10 rounded-xl transition-all duration-200 shadow-sm',
                      newSubject.color === color
                        ? 'ring-2 ring-offset-2 ring-violet-500 scale-110 shadow-lg'
                        : 'hover:scale-110 hover:shadow-md'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setNewSubject((prev) => ({ ...prev, color }))
                    }
                  />
                ))}
              </div>
            </div>
          </div>

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
              Crear materia
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function SubjectCard({
  subject,
  onDelete,
  onArchive,
}: {
  subject: Subject;
  onDelete: () => void;
  onArchive: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-secondary-100" hover>
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: subject.color }}
      />

      <Link href={`/app/subjects/${subject.id}`}>
        <CardContent className="p-6 pt-7">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-105"
              style={{
                backgroundColor: subject.color,
                color: getContrastColor(subject.color),
              }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-secondary-900 truncate group-hover:text-violet-600 transition-colors">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="text-sm text-secondary-500 line-clamp-2 mt-1">
                  {subject.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default" size="sm" className="bg-secondary-100">
                  <FileText className="h-3 w-3 mr-1" />
                  {subject._count?.resources || 0} recursos
                </Badge>
                {subject.year && (
                  <Badge variant="default" size="sm" className="bg-secondary-100">
                    <Calendar className="h-3 w-3 mr-1" />
                    {subject.year}° año
                  </Badge>
                )}
                {subject.isArchived && (
                  <Badge variant="warning" size="sm">
                    <Archive className="h-3 w-3 mr-1" />
                    Archivada
                  </Badge>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-secondary-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </CardContent>
      </Link>

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            'text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100',
            showMenu && 'bg-secondary-100 text-secondary-600'
          )}
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-secondary-100 py-2 z-20 animate-fade-in overflow-hidden">
              <Link
                href={`/app/subjects/${subject.id}/edit`}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
              <button
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                onClick={() => {
                  onArchive();
                  setShowMenu(false);
                }}
              >
                <Archive className="h-4 w-4" />
                {subject.isArchived ? 'Desarchivar' : 'Archivar'}
              </button>
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
    </Card>
  );
}
