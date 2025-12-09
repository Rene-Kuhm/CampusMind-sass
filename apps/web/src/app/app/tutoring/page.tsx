'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { tutoring, TutorProfile, TutoringSession } from '@/lib/api';
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
  GraduationCap,
  Search,
  Star,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  MessageCircle,
  Video,
  User,
  ChevronLeft,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  BookOpen,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TutoringPage() {
  const { token } = useAuth();
  const [view, setView] = useState<'search' | 'my-sessions' | 'tutor-detail'>('search');
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
  const [mySessions, setMySessions] = useState<TutoringSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    subject: '',
    university: '',
    minRating: 0,
    maxRate: 0,
  });

  // Booking state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    subject: '',
    scheduledAt: '',
    duration: 60,
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tutors
  const loadTutors = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await tutoring.searchTutors(token, searchFilters);
      setTutors(result.tutors);
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, searchFilters]);

  // Load my sessions
  const loadSessions = useCallback(async () => {
    if (!token) return;
    try {
      const sessions = await tutoring.getSessionsAsStudent(token);
      setMySessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [token]);

  useEffect(() => {
    if (view === 'search') {
      loadTutors();
    } else if (view === 'my-sessions') {
      loadSessions();
    }
  }, [view, loadTutors, loadSessions]);

  // View tutor
  const handleViewTutor = async (id: string) => {
    if (!token) return;
    try {
      const tutor = await tutoring.getTutor(token, id);
      setSelectedTutor(tutor);
      setView('tutor-detail');
    } catch (error) {
      console.error('Error loading tutor:', error);
    }
  };

  // Book session
  const handleBookSession = async () => {
    if (!token || !selectedTutor) return;
    setIsSubmitting(true);
    try {
      const session = await tutoring.bookSession(token, {
        tutorId: selectedTutor.id,
        ...bookingForm,
      });
      setMySessions(prev => [...prev, session]);
      setIsBookingOpen(false);
      setBookingForm({ subject: '', scheduledAt: '', duration: 60, notes: '' });
    } catch (error) {
      console.error('Error booking session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel session
  const handleCancelSession = async (sessionId: string) => {
    if (!token) return;
    try {
      await tutoring.updateSession(token, sessionId, { status: 'CANCELLED' });
      setMySessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'CANCELLED' } : s));
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  const getSessionStatusBadge = (status: TutoringSession['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Confirmada</Badge>;
      case 'COMPLETED':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completada</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      default:
        return <Badge variant="warning"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    }
  };

  // Tutor detail view
  if (view === 'tutor-detail' && selectedTutor) {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
          <div className="relative p-6">
            <button
              onClick={() => { setView('search'); setSelectedTutor(null); }}
              className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver a buscar
            </button>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                {selectedTutor.user?.profile?.avatar ? (
                  <img src={selectedTutor.user.profile.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <User className="h-12 w-12 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-secondary-900">
                  {selectedTutor.user?.profile?.firstName} {selectedTutor.user?.profile?.lastName}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-secondary-600">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    {selectedTutor.rating.toFixed(1)} ({selectedTutor.reviewCount} reseñas)
                  </span>
                  {selectedTutor.university && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {selectedTutor.university}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {selectedTutor.totalSessions} sesiones
                  </span>
                </div>
                {selectedTutor.isVerified && (
                  <Badge variant="success" className="mt-2">
                    <CheckCircle className="h-3 w-3 mr-1" />Verificado
                  </Badge>
                )}
              </div>
              <div className="text-right">
                {selectedTutor.hourlyRate && (
                  <p className="text-2xl font-bold text-secondary-900">${selectedTutor.hourlyRate}/hr</p>
                )}
                <Button variant="gradient" className="mt-2" onClick={() => setIsBookingOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-3">Sobre mí</h3>
                  <p className="text-secondary-600">{selectedTutor.bio || 'Sin descripción'}</p>
                </CardContent>
              </Card>

              {/* Subjects */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-3">Materias que enseño</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutor.subjects.map(subject => (
                      <Badge key={subject} variant="secondary">{subject}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-secondary-900 mb-4">Reseñas</h3>
                  {(selectedTutor as any).reviews?.length > 0 ? (
                    <div className="space-y-4">
                      {(selectedTutor as any).reviews.map((review: any) => (
                        <div key={review.id} className="border-b border-secondary-100 pb-4 last:border-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-4 w-4",
                                    star <= review.rating ? "text-amber-500 fill-amber-500" : "text-secondary-200"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-secondary-500">
                              {review.student?.profile?.firstName} · {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && <p className="text-secondary-600 text-sm">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-secondary-500">Aún no hay reseñas</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-secondary-900 mb-3">Estadísticas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Sesiones totales</span>
                      <span className="font-medium">{selectedTutor.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Calificación</span>
                      <span className="font-medium flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {selectedTutor.rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary-600">Reseñas</span>
                      <span className="font-medium">{selectedTutor.reviewCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Agendar Sesión"
          variant="glass"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Materia *</label>
              <Select
                value={bookingForm.subject}
                onChange={(e) => setBookingForm(prev => ({ ...prev, subject: e.target.value }))}
                options={[
                  { value: '', label: 'Selecciona una materia' },
                  ...selectedTutor.subjects.map(s => ({ value: s, label: s })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Fecha y hora *</label>
              <Input
                type="datetime-local"
                value={bookingForm.scheduledAt}
                onChange={(e) => setBookingForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Duración</label>
              <Select
                value={String(bookingForm.duration)}
                onChange={(e) => setBookingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                options={[
                  { value: '30', label: '30 minutos' },
                  { value: '60', label: '1 hora' },
                  { value: '90', label: '1.5 horas' },
                  { value: '120', label: '2 horas' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Notas (opcional)</label>
              <textarea
                className="w-full px-3 py-2 border border-secondary-200 rounded-xl resize-none"
                rows={3}
                placeholder="¿En qué necesitas ayuda?"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsBookingOpen(false)}>Cancelar</Button>
              <Button
                variant="gradient"
                onClick={handleBookSession}
                disabled={!bookingForm.subject || !bookingForm.scheduledAt || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // My Sessions view
  if (view === 'my-sessions') {
    return (
      <div className="min-h-screen">
        <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-secondary-900">Mis Sesiones</h1>
                  <p className="text-secondary-500">Gestiona tus tutorías</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setView('search')}>
                <Search className="h-4 w-4 mr-2" />
                Buscar Tutores
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {mySessions.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-8 w-8" />}
                title="Sin sesiones"
                description="Aún no has agendado ninguna tutoría"
                action={<Button variant="gradient" onClick={() => setView('search')}>Buscar Tutores</Button>}
              />
            ) : (
              <div className="space-y-4">
                {mySessions.map(session => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-secondary-900">{session.subject}</h3>
                            {getSessionStatusBadge(session.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-secondary-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(session.scheduledAt).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {session.meetingUrl && session.status === 'CONFIRMED' && (
                            <Button variant="gradient" size="sm" onClick={() => window.open(session.meetingUrl, '_blank')}>
                              <Video className="h-4 w-4 mr-1" />
                              Unirse
                            </Button>
                          )}
                          {session.status === 'PENDING' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelSession(session.id)}>
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Search tutors view (default)
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
                    Tutorías
                  </span>
                </h1>
                <p className="text-secondary-500">Encuentra tutores para tus materias</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setView('my-sessions')}>
              <Calendar className="h-4 w-4 mr-2" />
              Mis Sesiones
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
              <Input
                placeholder="Buscar por materia..."
                className="pl-10"
                value={searchFilters.subject}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <Select
              value={String(searchFilters.minRating)}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
              options={[
                { value: '0', label: 'Todas las calificaciones' },
                { value: '4', label: '4+ estrellas' },
                { value: '4.5', label: '4.5+ estrellas' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : tutors.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-8 w-8" />}
              title="Sin tutores"
              description="No se encontraron tutores con los filtros seleccionados"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tutors.map(tutor => (
                <Card
                  key={tutor.id}
                  className="hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleViewTutor(tutor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        {tutor.user?.profile?.avatar ? (
                          <img src={tutor.user.profile.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary-900 truncate">
                          {tutor.user?.profile?.firstName} {tutor.user?.profile?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
                          <span className="text-sm text-secondary-400">({tutor.reviewCount})</span>
                        </div>
                        {tutor.university && (
                          <p className="text-sm text-secondary-500 mt-1 truncate">{tutor.university}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tutor.subjects.slice(0, 3).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {tutor.subjects.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{tutor.subjects.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-secondary-100">
                      {tutor.hourlyRate ? (
                        <span className="font-semibold text-secondary-900">${tutor.hourlyRate}/hr</span>
                      ) : (
                        <span className="text-secondary-500">Precio a consultar</span>
                      )}
                      <Badge variant="secondary">{tutor.totalSessions} sesiones</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
