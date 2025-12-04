'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components/layout';
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
} from 'lucide-react';
import { getContrastColor, subjectColors } from '@/lib/utils';

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
    <>
      <Header
        title="Materias"
        subtitle="Organiza tus recursos por materia"
      />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar materia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              onClick={() => setShowArchived(!showArchived)}
              leftIcon={<Archive className="h-4 w-4" />}
            >
              {showArchived ? 'Mostrando archivadas' : 'Ver archivadas'}
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Nueva materia
            </Button>
          </div>
        </div>

        {/* Subjects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredSubjects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title={searchQuery ? 'No se encontraron materias' : 'No tienes materias aún'}
              description={
                searchQuery
                  ? 'Intenta con otro término de búsqueda'
                  : 'Crea tu primera materia para empezar a organizar tus recursos'
              }
              action={
                !searchQuery && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Crear materia
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onDelete={() => handleDeleteSubject(subject.id)}
                onArchive={() => handleArchiveSubject(subject.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nueva materia"
        description="Crea un espacio para organizar los recursos de esta materia"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <Input
            label="Nombre de la materia"
            placeholder="Ej: Análisis Matemático I"
            value={newSubject.name}
            onChange={(e) =>
              setNewSubject((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />

          <Input
            label="Descripción (opcional)"
            placeholder="Descripción breve de la materia"
            value={newSubject.description}
            onChange={(e) =>
              setNewSubject((prev) => ({ ...prev, description: e.target.value }))
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Carrera"
              placeholder="Ej: Ingeniería"
              value={newSubject.career}
              onChange={(e) =>
                setNewSubject((prev) => ({ ...prev, career: e.target.value }))
              }
            />
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

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {subjectColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full transition-transform ${
                    newSubject.color === color
                      ? 'ring-2 ring-offset-2 ring-primary-500 scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() =>
                    setNewSubject((prev) => ({ ...prev, color }))
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear materia
            </Button>
          </div>
        </form>
      </Modal>
    </>
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
    <Card className="group relative hover:shadow-lg transition-shadow">
      <Link href={`/app/subjects/${subject.id}`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{
                backgroundColor: subject.color,
                color: getContrastColor(subject.color),
              }}
            >
              {subject.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                {subject.name}
              </h3>
              {subject.description && (
                <p className="text-sm text-secondary-500 line-clamp-2 mt-1">
                  {subject.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="default" size="sm">
                  {subject._count?.resources || 0} recursos
                </Badge>
                {subject.isArchived && (
                  <Badge variant="warning" size="sm">
                    Archivada
                  </Badge>
                )}
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-secondary-300 group-hover:text-primary-600 transition-colors" />
          </div>
        </CardContent>
      </Link>

      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          className="p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100"
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
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-20">
              <Link
                href={`/app/subjects/${subject.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                onClick={() => {
                  onArchive();
                  setShowMenu(false);
                }}
              >
                <Archive className="h-4 w-4" />
                {subject.isArchived ? 'Desarchivar' : 'Archivar'}
              </button>
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
    </Card>
  );
}
