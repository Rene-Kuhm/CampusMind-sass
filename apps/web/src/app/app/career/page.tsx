'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { career, UserCV, JobPosting, JobApplication } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  Briefcase,
  FileText,
  Plus,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  GraduationCap,
  User,
  Code,
  Award,
  Languages,
  ChevronRight,
  Search,
  Bookmark,
  Send,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'cv' | 'jobs' | 'applications';

export default function CareerPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('cv');
  const [cv, setCv] = useState<UserCV | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // Load data
  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [cvData, jobsData, appsData] = await Promise.all([
        career.getCV(token).catch(() => null),
        career.getJobs(token),
        career.getApplications(token),
      ]);
      setCv(cvData);
      setJobs(jobsData);
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply to job
  const handleApply = async () => {
    if (!token || !selectedJob) return;
    try {
      await career.applyToJob(token, selectedJob.id, { coverLetter: coverLetter || undefined });
      setIsApplyModalOpen(false);
      setSelectedJob(null);
      setCoverLetter('');
      loadData();
    } catch (error) {
      console.error('Error applying:', error);
    }
  };

  const getStatusBadge = (status: JobApplication['status']) => {
    const config: Record<string, { color: string; label: string }> = {
      SAVED: { color: 'secondary', label: 'Guardado' },
      APPLIED: { color: 'primary', label: 'Enviado' },
      SCREENING: { color: 'warning', label: 'En revisión' },
      INTERVIEWING: { color: 'warning', label: 'Entrevistas' },
      OFFER: { color: 'success', label: 'Oferta' },
      REJECTED: { color: 'error', label: 'Rechazado' },
      ACCEPTED: { color: 'success', label: 'Aceptado' },
      WITHDRAWN: { color: 'secondary', label: 'Retirado' },
    };
    const { color, label } = config[status] || config.SAVED;
    return <Badge variant={color as any}>{label}</Badge>;
  };

  const getJobTypeBadge = (type: JobPosting['type']) => {
    const labels: Record<string, string> = {
      FULL_TIME: 'Tiempo completo',
      PART_TIME: 'Medio tiempo',
      INTERNSHIP: 'Pasantía',
      FREELANCE: 'Freelance',
      CONTRACT: 'Contrato',
    };
    return labels[type] || type;
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isApplied = (jobId: string) => applications.some(a => a.jobId === jobId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                  Carrera Profesional
                </span>
              </h1>
              <p className="text-secondary-500 mt-0.5">CV, empleos y aplicaciones</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'cv', label: 'Mi CV', icon: FileText },
              { id: 'jobs', label: 'Empleos', icon: Briefcase },
              { id: 'applications', label: 'Mis Aplicaciones', icon: Send },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-white shadow-sm text-blue-600"
                    : "text-secondary-600 hover:bg-white/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* CV Tab */}
          {activeTab === 'cv' && (
            <div className="space-y-6">
              {!cv ? (
                <EmptyState
                  icon={<FileText className="h-8 w-8" />}
                  title="Sin CV"
                  description="Crea tu CV profesional para aplicar a empleos"
                  action={
                    <Button variant="gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear CV
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Profile Card */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                          {cv.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-secondary-900">{cv.fullName}</h2>
                          {cv.title && <p className="text-lg text-secondary-600">{cv.title}</p>}
                          {cv.summary && <p className="text-secondary-500 mt-2">{cv.summary}</p>}
                          <div className="flex flex-wrap gap-3 mt-3 text-sm text-secondary-500">
                            {cv.email && <span>{cv.email}</span>}
                            {cv.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{cv.location}</span>}
                            {cv.linkedIn && <a href={cv.linkedIn} target="_blank" className="text-blue-500 hover:underline">LinkedIn</a>}
                            {cv.github && <a href={cv.github} target="_blank" className="text-blue-500 hover:underline">GitHub</a>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Education */}
                  {cv.education && cv.education.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-blue-500" />
                          Educación
                        </h3>
                        <div className="space-y-4">
                          {cv.education.map(edu => (
                            <div key={edu.id} className="border-l-2 border-blue-200 pl-4">
                              <p className="font-medium text-secondary-900">{edu.degree}</p>
                              <p className="text-secondary-600">{edu.institution}</p>
                              <p className="text-sm text-secondary-500">
                                {new Date(edu.startDate).getFullYear()} - {edu.isCurrent ? 'Presente' : new Date(edu.endDate!).getFullYear()}
                                {edu.gpa && ` • GPA: ${edu.gpa}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Experience */}
                  {cv.experience && cv.experience.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-indigo-500" />
                          Experiencia
                        </h3>
                        <div className="space-y-4">
                          {cv.experience.map(exp => (
                            <div key={exp.id} className="border-l-2 border-indigo-200 pl-4">
                              <p className="font-medium text-secondary-900">{exp.position}</p>
                              <p className="text-secondary-600">{exp.company}</p>
                              <p className="text-sm text-secondary-500">
                                {new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Presente' : new Date(exp.endDate!).getFullYear()}
                              </p>
                              {exp.description && <p className="text-sm text-secondary-500 mt-1">{exp.description}</p>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Skills */}
                  {cv.skills && cv.skills.length > 0 && (
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                          <Code className="h-5 w-5 text-emerald-500" />
                          Habilidades
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {cv.skills.map(skill => (
                            <Badge key={skill.id} variant="secondary">
                              {skill.name}
                              <span className="ml-1 text-xs opacity-70">• {skill.level.toLowerCase()}</span>
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar empleos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredJobs.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-8 w-8" />}
                  title="Sin resultados"
                  description="No hay empleos que coincidan con tu búsqueda"
                />
              ) : (
                <div className="space-y-3">
                  {filteredJobs.map(job => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-secondary-900">{job.title}</h3>
                              <p className="text-secondary-600">{job.company}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-secondary-500">
                                {job.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />{job.location}
                                  </span>
                                )}
                                {job.isRemote && <Badge variant="success" className="text-xs">Remoto</Badge>}
                                <Badge variant="outline" className="text-xs">{getJobTypeBadge(job.type)}</Badge>
                                {job.salaryMin && job.salaryMax && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()} {job.currency}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isApplied(job.id) ? (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aplicado
                              </Badge>
                            ) : (
                              <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => { setSelectedJob(job); setIsApplyModalOpen(true); }}
                              >
                                Aplicar
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
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <EmptyState
                  icon={<Send className="h-8 w-8" />}
                  title="Sin aplicaciones"
                  description="Aplica a empleos para verlos aquí"
                />
              ) : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <Card key={app.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-secondary-900">{app.job.title}</h3>
                              <p className="text-secondary-600">{app.job.company}</p>
                              <p className="text-sm text-secondary-500">
                                Aplicado el {new Date(app.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => { setIsApplyModalOpen(false); setSelectedJob(null); }}
        title={`Aplicar a ${selectedJob?.title}`}
        size="md"
      >
        {selectedJob && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-xl">
              <p className="font-medium text-secondary-900">{selectedJob.company}</p>
              <p className="text-sm text-secondary-500">{selectedJob.location} {selectedJob.isRemote && '• Remoto'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Carta de presentación (opcional)
              </label>
              <textarea
                className="w-full h-40 p-3 border border-secondary-200 rounded-lg resize-none"
                placeholder="Escribe por qué eres el candidato ideal..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsApplyModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleApply}>
                <Send className="h-4 w-4 mr-2" />
                Enviar Aplicación
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
