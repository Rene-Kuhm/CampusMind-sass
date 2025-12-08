'use client';

import Link from 'next/link';
import {
  BookOpen,
  Brain,
  Search,
  FileText,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Clock,
  Users,
  TrendingUp,
  Play,
  ChevronRight,
  Globe,
  Award,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                CampusMind
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Características
              </Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Cómo funciona
              </Link>
              <Link href="#testimonials" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Testimonios
              </Link>
              <Link href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Precios
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-primary-600 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary-500/25 font-medium transition-all duration-300 hover:-translate-y-0.5"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-40 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-50 to-violet-50 border border-primary-200/50 text-primary-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm">
              <div className="relative">
                <Sparkles className="h-4 w-4" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-4 w-4 text-primary-400" />
                </div>
              </div>
              Potenciado por IA de última generación
              <ChevronRight className="h-4 w-4" />
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 tracking-tight">
              Tu copiloto académico
              <span className="block mt-2 bg-gradient-to-r from-primary-600 via-violet-600 to-primary-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                para la universidad
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Busca en fuentes académicas, genera resúmenes estilo Harvard,
              organiza tu cursada y prepara tus exámenes como un estudiante de élite.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-violet-600 text-white px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-primary-500/25 font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
              >
                Comenzar gratis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#how-it-works"
                className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-xl hover:border-slate-300 hover:shadow-lg font-semibold text-lg transition-all duration-300"
              >
                <Play className="h-5 w-5 text-primary-600" />
                Ver cómo funciona
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary-500" />
                <span>100% seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <span>Setup en 2 minutos</span>
              </div>
            </div>
          </div>

          {/* Hero image/mockup */}
          <div className="relative max-w-6xl mx-auto mt-16">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-500/20 border border-slate-200/50">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-600/5 to-violet-600/5" />
              <div className="bg-gradient-to-b from-slate-100 to-white p-1">
                {/* Browser mockup header */}
                <div className="bg-slate-100 rounded-t-xl px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2 shadow-sm">
                      <Shield className="h-3 w-3 text-emerald-500" />
                      app.campusmind.io
                    </div>
                  </div>
                </div>
                {/* App preview */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-b-lg p-8 min-h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-slate-400 font-medium">Vista previa de la aplicación</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-xl p-4 border border-slate-100 animate-float hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Productividad</p>
                  <p className="font-bold text-slate-900">+47% mejora</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/3 bg-white rounded-xl shadow-xl p-4 border border-slate-100 animate-float delay-300 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Papers procesados</p>
                  <p className="font-bold text-slate-900">50,000+</p>
                </div>
              </div>
            </div>

            <div className="absolute left-1/4 -bottom-4 bg-white rounded-xl shadow-xl p-4 border border-slate-100 animate-float delay-500 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Estudiantes activos</p>
                  <p className="font-bold text-slate-900">10,000+</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatCard number="10K+" label="Estudiantes activos" icon={<Users className="h-5 w-5" />} />
              <StatCard number="500K+" label="Documentos procesados" icon={<FileText className="h-5 w-5" />} />
              <StatCard number="98%" label="Satisfacción" icon={<Star className="h-5 w-5" />} />
              <StatCard number="24/7" label="Disponibilidad" icon={<Clock className="h-5 w-5" />} />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Zap className="h-4 w-4" />
                Características
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Todo lo que necesitas para
                <span className="bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent"> estudiar mejor</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Herramientas de nivel profesional diseñadas específicamente para estudiantes universitarios exigentes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Search className="h-6 w-6" />}
                title="Buscador Académico"
                description="Busca en OpenAlex, Semantic Scholar y otras fuentes académicas. Encuentra papers, libros y recursos open access."
                gradient="from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="Motor RAG Inteligente"
                description="Pregunta sobre tus recursos en lenguaje natural. Obtén respuestas con citas y referencias precisas."
                gradient="from-violet-500 to-purple-500"
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Resúmenes Harvard-Style"
                description="Genera resúmenes académicos con contexto teórico, ideas clave, definiciones, ejemplos y checklist de repaso."
                gradient="from-emerald-500 to-teal-500"
              />
              <FeatureCard
                icon={<BookOpen className="h-6 w-6" />}
                title="Workspaces por Materia"
                description="Organiza tus recursos por materia. Todo en un solo lugar: PDFs, papers, videos, notas y más."
                gradient="from-amber-500 to-orange-500"
              />
              <FeatureCard
                icon={<GraduationCap className="h-6 w-6" />}
                title="Preparación de Exámenes"
                description="Flashcards automáticas, preguntas tipo examen y técnicas de estudio basadas en evidencia."
                gradient="from-rose-500 to-pink-500"
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title="Personalización Total"
                description="Adapta el estilo de respuestas a tu carrera, nivel y preferencias de estudio."
                gradient="from-primary-500 to-violet-500"
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Play className="h-4 w-4" />
                Cómo funciona
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Empieza en 3 simples pasos
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Configura tu espacio de estudio en minutos y comienza a mejorar tu rendimiento académico.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                number="01"
                title="Crea tu cuenta"
                description="Regístrate gratis y configura tu perfil académico con tu carrera y preferencias de estudio."
                icon={<Users className="h-6 w-6" />}
              />
              <StepCard
                number="02"
                title="Organiza tus materias"
                description="Crea workspaces para cada materia y sube tus recursos: PDFs, papers, notas y más."
                icon={<BookOpen className="h-6 w-6" />}
              />
              <StepCard
                number="03"
                title="Estudia con IA"
                description="Usa el copiloto para hacer preguntas, generar resúmenes y preparar tus exámenes."
                icon={<Brain className="h-6 w-6" />}
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Star className="h-4 w-4" />
                Testimonios
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Lo que dicen nuestros estudiantes
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Miles de estudiantes ya usan CampusMind para mejorar su rendimiento académico.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard
                quote="CampusMind cambió completamente mi forma de estudiar. Los resúmenes estilo Harvard me ayudaron a aprobar todas mis materias."
                author="María García"
                role="Estudiante de Medicina, UBA"
                rating={5}
              />
              <TestimonialCard
                quote="El buscador académico es increíble. Encuentro papers relevantes en segundos que antes me tomaban horas."
                author="Lucas Rodríguez"
                role="Estudiante de Ingeniería, ITBA"
                rating={5}
              />
              <TestimonialCard
                quote="Las flashcards automáticas y el motor RAG son un game changer para preparar exámenes."
                author="Sofía Martínez"
                role="Estudiante de Derecho, UCA"
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Award className="h-4 w-4" />
              Planes
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Comienza gratis, escala cuando quieras
            </h2>
            <p className="text-lg text-slate-600 mb-12">
              Plan gratuito generoso para comenzar. Actualiza cuando necesites más poder.
            </p>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold mb-4">
                <Sparkles className="h-5 w-5" />
                Plan Gratuito
              </div>
              <div className="text-5xl font-bold text-slate-900 mb-2">$0</div>
              <p className="text-slate-500 mb-6">Para siempre</p>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>3 materias activas</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>50 consultas al copiloto/mes</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>Búsqueda académica ilimitada</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span>Resúmenes Harvard-Style</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full bg-gradient-to-r from-primary-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-violet-600" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Floating decorations */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              Únete hoy
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Empieza a estudiar de forma
              <span className="block">más inteligente</span>
            </h2>
            <p className="text-primary-100 text-lg mb-10 max-w-2xl mx-auto">
              Únete a más de 10,000 estudiantes que ya usan CampusMind para mejorar su rendimiento académico y alcanzar sus metas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl hover:shadow-xl font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
              >
                Crear cuenta gratuita
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white/20 font-semibold text-lg transition-all duration-300"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">CampusMind</span>
              </div>
              <p className="text-slate-400 mb-4 max-w-sm">
                Tu copiloto académico integral para la universidad. Estudia más inteligente, no más duro.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  <span>Español</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-3">
                <li><Link href="#features" className="hover:text-white transition-colors">Características</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="#testimonials" className="hover:text-white transition-colors">Testimonios</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Iniciar sesión</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} CampusMind. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span>Hecho con</span>
              <span className="text-red-500">❤</span>
              <span>para estudiantes</span>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-700 {
          animation-delay: 700ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
}

function StatCard({
  number,
  label,
  icon,
}: {
  number: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl text-primary-600 mb-3">
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{number}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-6 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative p-8 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="absolute -top-4 left-8 bg-gradient-to-r from-primary-600 to-violet-600 text-white text-sm font-bold px-4 py-1 rounded-full">
        {number}
      </div>
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-5 w-5 text-amber-400 fill-current" />
        ))}
      </div>
      <p className="text-slate-600 mb-6 leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-500 rounded-full flex items-center justify-center text-white font-semibold">
          {author.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
