'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Brain,
  BarChart3,
  Calendar,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Bienvenido a CampusMind',
    description: 'Tu copiloto académico integral que te ayuda a estudiar de manera más inteligente.',
    icon: GraduationCap,
    gradient: 'from-primary-500 to-violet-500',
    features: [
      'Organiza tus materias y recursos',
      'Estudia con herramientas avanzadas',
      'Mejora tu rendimiento académico',
    ],
  },
  {
    title: 'Copiloto IA',
    description: 'Tu asistente de estudio personal potenciado por inteligencia artificial.',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-500',
    features: [
      'Haz preguntas sobre cualquier tema',
      'Genera resúmenes automáticos',
      'Obtén explicaciones personalizadas',
    ],
  },
  {
    title: 'Flashcards Inteligentes',
    description: 'Memoriza conceptos con el sistema de repetición espaciada.',
    icon: Brain,
    gradient: 'from-pink-500 to-rose-500',
    features: [
      'Crea tarjetas manualmente o con IA',
      'Sistema de repetición espaciada SM-2',
      'Seguimiento de tu progreso',
    ],
  },
  {
    title: 'Búsqueda Académica',
    description: 'Encuentra recursos de múltiples fuentes académicas en un solo lugar.',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-500',
    features: [
      'Papers y publicaciones científicas',
      'Libros y textos académicos',
      'Videos educativos y cursos',
    ],
  },
  {
    title: 'Organiza tu Tiempo',
    description: 'Planifica tus estudios con el calendario y técnica Pomodoro.',
    icon: Calendar,
    gradient: 'from-orange-500 to-red-500',
    features: [
      'Calendario de estudio integrado',
      'Técnica Pomodoro personalizable',
      'Recordatorios inteligentes',
    ],
  },
  {
    title: 'Sigue tu Progreso',
    description: 'Visualiza tu avance y mantén la motivación con gamificación.',
    icon: BarChart3,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      'Dashboard de estadísticas',
      'Sistema de niveles y logros',
      'Racha de días estudiando',
    ],
  },
];

const STORAGE_KEY = 'campusmind-onboarding-complete';

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to avoid flash
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-lg bg-white dark:bg-secondary-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-100 dark:bg-secondary-800">
          <div
            className={cn('h-full transition-all duration-300 bg-gradient-to-r', step.gradient)}
            style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 pt-12">
          {/* Icon */}
          <div
            className={cn(
              'w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6',
              'bg-gradient-to-br shadow-lg',
              step.gradient
            )}
          >
            <Icon className="h-10 w-10 text-white" />
          </div>

          {/* Text */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-3">
              {step.title}
            </h2>
            <p className="text-secondary-500 dark:text-secondary-400">
              {step.description}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-800"
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br text-white text-xs',
                    step.gradient
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                <span className="text-sm text-secondary-700 dark:text-secondary-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                currentStep === 0
                  ? 'text-secondary-300 dark:text-secondary-600 cursor-not-allowed'
                  : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {/* Step indicators */}
            <div className="flex gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentStep
                      ? 'w-6 bg-gradient-to-r ' + step.gradient
                      : 'bg-secondary-200 dark:bg-secondary-700 hover:bg-secondary-300 dark:hover:bg-secondary-600'
                  )}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors',
                'bg-gradient-to-r hover:shadow-lg',
                step.gradient
              )}
            >
              {isLastStep ? 'Comenzar' : 'Siguiente'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Skip link */}
          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="block w-full mt-4 text-center text-sm text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
            >
              Omitir tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to manually trigger onboarding
export function useOnboarding() {
  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const isCompleted = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  };

  return { resetOnboarding, isCompleted };
}
