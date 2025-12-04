import Link from 'next/link';
import { BookOpen, Brain, Search, FileText, GraduationCap, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-secondary-900">CampusMind</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-secondary-600 hover:text-secondary-900 font-medium"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 font-medium transition-colors"
              >
                Registrarse gratis
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Potenciado por IA
            </div>
            <h1 className="text-5xl font-bold text-secondary-900 mb-6 text-balance">
              Tu copiloto académico integral para la universidad
            </h1>
            <p className="text-xl text-secondary-600 mb-8 text-balance">
              Busca en fuentes académicas, genera resúmenes estilo Harvard,
              organiza tu cursada y prepara tus exámenes como un estudiante top.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 font-semibold text-lg transition-colors"
              >
                Comenzar gratis
              </Link>
              <Link
                href="#features"
                className="border border-secondary-300 text-secondary-700 px-8 py-3 rounded-lg hover:bg-secondary-50 font-semibold text-lg transition-colors"
              >
                Ver características
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
              Todo lo que necesitas para estudiar mejor
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Search className="h-6 w-6" />}
                title="Buscador Académico"
                description="Busca en OpenAlex, Semantic Scholar y otras fuentes académicas. Encuentra papers, libros y recursos open access."
              />
              <FeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="Motor RAG Inteligente"
                description="Pregunta sobre tus recursos en lenguaje natural. Obtén respuestas con citas y referencias precisas."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Resúmenes Harvard-Style"
                description="Genera resúmenes académicos con contexto teórico, ideas clave, definiciones, ejemplos y checklist de repaso."
              />
              <FeatureCard
                icon={<BookOpen className="h-6 w-6" />}
                title="Workspaces por Materia"
                description="Organiza tus recursos por materia. Todo en un solo lugar: PDFs, papers, videos, notas y más."
              />
              <FeatureCard
                icon={<GraduationCap className="h-6 w-6" />}
                title="Preparación de Exámenes"
                description="Flashcards automáticas, preguntas tipo examen y técnicas de estudio basadas en evidencia."
              />
              <FeatureCard
                icon={<Sparkles className="h-6 w-6" />}
                title="Personalización Total"
                description="Adapta el estilo de respuestas a tu carrera, nivel y preferencias de estudio."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-primary-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Empieza a estudiar de forma más inteligente
            </h2>
            <p className="text-primary-100 text-lg mb-8">
              Únete a miles de estudiantes que ya usan CampusMind para mejorar su rendimiento académico.
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 font-semibold text-lg transition-colors"
            >
              Crear cuenta gratuita
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 text-secondary-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary-400" />
              <span className="text-white font-semibold">CampusMind</span>
            </div>
            <p className="text-sm">
              © {new Date().getFullYear()} CampusMind. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-secondary-200 hover:border-primary-200 hover:shadow-lg transition-all">
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h3>
      <p className="text-secondary-600">{description}</p>
    </div>
  );
}
