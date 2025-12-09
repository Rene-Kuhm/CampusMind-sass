'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { grades, Grade, GradeCategory, GradeStats, subjects as subjectsApi, Subject } from '@/lib/api';
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
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  BarChart3,
  Award,
  Loader2,
  ChevronRight,
  Edit,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GradesPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [gradesList, setGradesList] = useState<Grade[]>([]);
  const [categories, setCategories] = useState<GradeCategory[]>([]);
  const [stats, setStats] = useState<GradeStats | null>(null);
  const [overallStats, setOverallStats] = useState<{ overallAverage: number; totalSubjects: number; totalGrades: number; bySubject: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Form state
  const [gradeForm, setGradeForm] = useState({
    name: '',
    score: '',
    maxScore: '10',
    weight: '1',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    weight: '1',
    color: '#3B82F6',
  });

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
      grades.getOverallStats(token).then(setOverallStats).catch(console.error);
      setIsLoading(false);
    }
  }, [token]);

  // Load grades when subject changes
  const loadSubjectData = useCallback(async () => {
    if (!token || !selectedSubject) return;
    try {
      const [gradesData, categoriesData, statsData] = await Promise.all([
        grades.list(token, selectedSubject.id),
        grades.listCategories(token, selectedSubject.id),
        grades.getStats(token, selectedSubject.id),
      ]);
      setGradesList(Array.isArray(gradesData) ? gradesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  }, [token, selectedSubject]);

  useEffect(() => {
    loadSubjectData();
  }, [loadSubjectData]);

  // Add grade
  const handleAddGrade = async () => {
    if (!token || !selectedSubject || !gradeForm.name || !gradeForm.score) return;
    try {
      await grades.create(token, selectedSubject.id, {
        name: gradeForm.name,
        score: parseFloat(gradeForm.score),
        maxScore: parseFloat(gradeForm.maxScore),
        weight: parseFloat(gradeForm.weight),
        date: gradeForm.date,
        categoryId: gradeForm.categoryId || undefined,
        notes: gradeForm.notes || undefined,
      });
      setIsGradeModalOpen(false);
      setGradeForm({ name: '', score: '', maxScore: '10', weight: '1', date: new Date().toISOString().split('T')[0], categoryId: '', notes: '' });
      loadSubjectData();
      grades.getOverallStats(token).then(setOverallStats);
    } catch (error) {
      console.error('Error adding grade:', error);
    }
  };

  // Delete grade
  const handleDeleteGrade = async (id: string) => {
    if (!token) return;
    try {
      await grades.delete(token, id);
      loadSubjectData();
      grades.getOverallStats(token).then(setOverallStats);
    } catch (error) {
      console.error('Error deleting grade:', error);
    }
  };

  // Add category
  const handleAddCategory = async () => {
    if (!token || !selectedSubject || !categoryForm.name) return;
    try {
      await grades.createCategory(token, selectedSubject.id, {
        name: categoryForm.name,
        weight: parseFloat(categoryForm.weight),
        color: categoryForm.color,
      });
      setIsCategoryModalOpen(false);
      setCategoryForm({ name: '', weight: '1', color: '#3B82F6' });
      loadSubjectData();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  // Get grade color based on score
  const getGradeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50';
    if (percentage >= 60) return 'text-blue-600 bg-blue-50';
    if (percentage >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getAverageColor = (average: number) => {
    if (average >= 8) return 'from-emerald-500 to-green-500';
    if (average >= 6) return 'from-blue-500 to-cyan-500';
    if (average >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  // Subject list view
  if (!selectedSubject) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                    Calculadora de Notas
                  </span>
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Seguimiento de calificaciones y promedio
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Overall Stats */}
            {overallStats && overallStats.totalGrades > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center", getAverageColor(overallStats.overallAverage))}>
                        <Award className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Promedio General</p>
                        <p className="text-2xl font-bold text-secondary-900">{overallStats.overallAverage.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Materias</p>
                        <p className="text-2xl font-bold text-secondary-900">{overallStats.totalSubjects}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-secondary-500">Total Notas</p>
                        <p className="text-2xl font-bold text-secondary-900">{overallStats.totalGrades}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Subject Selection */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : subjects.length === 0 ? (
              <EmptyState
                icon={<BookOpen className="h-8 w-8" />}
                title="Sin materias"
                description="Crea una materia primero para agregar notas"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(subject => {
                  const subjectStats = overallStats?.bySubject.find(s => s.subjectId === subject.id);
                  return (
                    <Card
                      key={subject.id}
                      className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      <div className="h-2" style={{ backgroundColor: subject.color || '#3B82F6' }} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${subject.color}20` }}>
                            <BookOpen className="h-6 w-6" style={{ color: subject.color }} />
                          </div>
                          {subjectStats && subjectStats.totalGrades > 0 && (
                            <Badge className={cn("text-lg font-bold px-3 py-1", getGradeColor(subjectStats.average, 10))}>
                              {subjectStats.average.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-secondary-900 mb-1">{subject.name}</h3>
                        <p className="text-sm text-secondary-500">
                          {subjectStats?.totalGrades || 0} notas registradas
                        </p>
                        <div className="flex items-center justify-end pt-3 mt-3 border-t border-secondary-100">
                          <ChevronRight className="h-5 w-5 text-secondary-400 group-hover:text-primary-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Subject detail view
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="relative p-6">
          <button
            onClick={() => setSelectedSubject(null)}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
          >
            ← Volver
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: selectedSubject.color || '#3B82F6' }}>
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">{selectedSubject.name}</h1>
                <p className="text-secondary-500">Gestiona las notas de esta materia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Categoría
              </Button>
              <Button variant="gradient" onClick={() => setIsGradeModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Nota
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center", getAverageColor(stats.weightedAverage))}>
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Promedio Ponderado</p>
                      <p className="text-xl font-bold text-secondary-900">{stats.weightedAverage.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Promedio Simple</p>
                      <p className="text-xl font-bold text-secondary-900">{stats.average.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Nota más alta</p>
                      <p className="text-xl font-bold text-secondary-900">
                        {stats.highestGrade ? `${stats.highestGrade.score}/${stats.highestGrade.maxScore}` : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Nota más baja</p>
                      <p className="text-xl font-bold text-secondary-900">
                        {stats.lowestGrade ? `${stats.lowestGrade.score}/${stats.lowestGrade.maxScore}` : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grades List */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                Notas ({gradesList.length})
              </h3>

              {gradesList.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                  <p className="text-secondary-500">No hay notas registradas</p>
                  <Button variant="gradient" className="mt-4" onClick={() => setIsGradeModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Nota
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {gradesList.map(grade => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg", getGradeColor(grade.score, grade.maxScore))}>
                          {grade.score}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">{grade.name}</p>
                          <div className="flex items-center gap-2 text-sm text-secondary-500">
                            {grade.category && (
                              <Badge variant="outline" className="text-xs">{grade.category.name}</Badge>
                            )}
                            <span>Máx: {grade.maxScore}</span>
                            <span>Peso: {grade.weight}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(grade.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGrade(grade.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Overview */}
          {categories.length > 0 && stats?.byCategory && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Promedio por Categoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.byCategory.map((cat, idx) => (
                    <div key={idx} className="p-4 bg-secondary-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-secondary-700">{cat.categoryName}</span>
                        <Badge className={getGradeColor(cat.average, 10)}>{cat.average.toFixed(1)}</Badge>
                      </div>
                      <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                          style={{ width: `${(cat.average / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-secondary-500 mt-1">{cat.count} notas</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title="Agregar Nota"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
            <Input
              placeholder="Ej: Parcial 1, TP2..."
              value={gradeForm.name}
              onChange={(e) => setGradeForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Nota *</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                placeholder="8.5"
                value={gradeForm.score}
                onChange={(e) => setGradeForm(prev => ({ ...prev, score: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Nota Máxima</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={gradeForm.maxScore}
                onChange={(e) => setGradeForm(prev => ({ ...prev, maxScore: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Peso</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={gradeForm.weight}
                onChange={(e) => setGradeForm(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fecha</label>
              <Input
                type="date"
                value={gradeForm.date}
                onChange={(e) => setGradeForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Categoría</label>
              <Select
                value={gradeForm.categoryId}
                onChange={(e) => setGradeForm(prev => ({ ...prev, categoryId: e.target.value }))}
                options={[
                  { value: '', label: 'Sin categoría' },
                  ...categories.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Notas</label>
            <Input
              placeholder="Observaciones opcionales..."
              value={gradeForm.notes}
              onChange={(e) => setGradeForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsGradeModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleAddGrade} disabled={!gradeForm.name || !gradeForm.score}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva Categoría"
        variant="glass"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
            <Input
              placeholder="Ej: Parciales, TPs, Final..."
              value={categoryForm.name}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Peso</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={categoryForm.weight}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, weight: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Color</label>
            <input
              type="color"
              value={categoryForm.color}
              onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleAddCategory} disabled={!categoryForm.name}>
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
