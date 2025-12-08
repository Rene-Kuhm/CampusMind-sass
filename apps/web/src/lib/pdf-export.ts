import jsPDF from 'jspdf';

interface FlashcardData {
  front: string;
  back: string;
  level?: number;
}

interface QuizQuestionData {
  type: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

interface QuizData {
  name: string;
  questions: QuizQuestionData[];
  passingScore?: number;
}

interface ProgressData {
  totalFlashcardsStudied: number;
  totalQuizzesCompleted: number;
  currentStreak: number;
  totalPoints: number;
  level: number;
  levelName: string;
  flashcardAccuracy: number;
  quizAverageScore: number;
}

// Colors
const COLORS = {
  primary: '#7C3AED',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  dark: '#1F2937',
  light: '#F3F4F6',
};

/**
 * Export flashcard deck to PDF
 */
export function exportFlashcardsToPDF(
  deckName: string,
  cards: FlashcardData[],
  options?: { includeAnswers?: boolean }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('CampusMind', margin, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text(`Flashcards: ${deckName}`, margin, yPos);
  yPos += 15;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text(`Total de tarjetas: ${cards.length}`, margin, yPos);
  yPos += 5;
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);
  yPos += 15;

  // Cards
  doc.setFontSize(12);
  cards.forEach((card, index) => {
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    // Card number
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    doc.text(`Tarjeta ${index + 1}`, margin, yPos);
    yPos += 6;

    // Question
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(11);
    doc.text('Pregunta:', margin, yPos);
    yPos += 5;
    doc.setFontSize(10);
    const questionLines = doc.splitTextToSize(card.front, pageWidth - margin * 2);
    doc.text(questionLines, margin + 5, yPos);
    yPos += questionLines.length * 5 + 3;

    // Answer (if included)
    if (options?.includeAnswers !== false) {
      doc.setTextColor(COLORS.success);
      doc.setFontSize(11);
      doc.text('Respuesta:', margin, yPos);
      yPos += 5;
      doc.setTextColor(COLORS.dark);
      doc.setFontSize(10);
      const answerLines = doc.splitTextToSize(card.back, pageWidth - margin * 2);
      doc.text(answerLines, margin + 5, yPos);
      yPos += answerLines.length * 5 + 3;
    }

    // Level indicator
    if (card.level !== undefined) {
      doc.setFontSize(9);
      doc.setTextColor(COLORS.secondary);
      doc.text(`Nivel de dominio: ${card.level}/6`, margin, yPos);
      yPos += 5;
    }

    // Separator
    doc.setDrawColor(COLORS.light);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  });

  // Footer on last page
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text(
    'Generado por CampusMind - Tu campus inteligente',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`flashcards-${deckName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Export quiz to PDF
 */
export function exportQuizToPDF(
  quiz: QuizData,
  options?: { includeAnswers?: boolean }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('CampusMind', margin, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text(`Quiz: ${quiz.name}`, margin, yPos);
  yPos += 15;

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text(`Total de preguntas: ${quiz.questions.length}`, margin, yPos);
  yPos += 5;
  if (quiz.passingScore) {
    doc.text(`Puntuación mínima: ${quiz.passingScore}%`, margin, yPos);
    yPos += 5;
  }
  doc.text(`Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);
  yPos += 15;

  // Separator
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Questions
  quiz.questions.forEach((question, index) => {
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Question number and type
    doc.setTextColor(COLORS.primary);
    doc.setFontSize(11);
    const typeLabels: Record<string, string> = {
      multiple_choice: 'Opción múltiple',
      true_false: 'Verdadero/Falso',
      short_answer: 'Respuesta corta',
    };
    doc.text(`${index + 1}. [${typeLabels[question.type] || question.type}]`, margin, yPos);
    yPos += 7;

    // Question text
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(11);
    const questionLines = doc.splitTextToSize(question.question, pageWidth - margin * 2);
    doc.text(questionLines, margin, yPos);
    yPos += questionLines.length * 5 + 5;

    // Options for multiple choice
    if (question.options && question.options.length > 0) {
      doc.setFontSize(10);
      question.options.forEach((option) => {
        const optionLines = doc.splitTextToSize(`   ${option}`, pageWidth - margin * 2 - 10);
        doc.text(optionLines, margin + 5, yPos);
        yPos += optionLines.length * 5 + 2;
      });
      yPos += 3;
    }

    // Answer (if included)
    if (options?.includeAnswers) {
      doc.setTextColor(COLORS.success);
      doc.setFontSize(10);
      doc.text(`Respuesta correcta: ${question.correctAnswer}`, margin, yPos);
      yPos += 5;

      if (question.explanation) {
        doc.setTextColor(COLORS.secondary);
        doc.setFontSize(9);
        const explanationLines = doc.splitTextToSize(`Explicación: ${question.explanation}`, pageWidth - margin * 2);
        doc.text(explanationLines, margin, yPos);
        yPos += explanationLines.length * 4 + 3;
      }
    }

    // Separator
    doc.setDrawColor(COLORS.light);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  });

  // Answer key page (if not included inline)
  if (!options?.includeAnswers) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.text('Clave de respuestas', margin, yPos);
    yPos += 15;

    doc.setFontSize(10);
    quiz.questions.forEach((question, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setTextColor(COLORS.dark);
      doc.text(`${index + 1}. ${question.correctAnswer}`, margin, yPos);
      yPos += 5;

      if (question.explanation) {
        doc.setTextColor(COLORS.secondary);
        doc.setFontSize(9);
        const explanationLines = doc.splitTextToSize(`   ${question.explanation}`, pageWidth - margin * 2 - 10);
        doc.text(explanationLines, margin, yPos);
        yPos += explanationLines.length * 4 + 3;
        doc.setFontSize(10);
      }
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text(
    'Generado por CampusMind - Tu campus inteligente',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`quiz-${quiz.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/**
 * Export progress report to PDF
 */
export function exportProgressToPDF(
  userName: string,
  progress: ProgressData,
  subjects?: { name: string; progress: number }[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('CampusMind', margin, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text('Reporte de Progreso', margin, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setTextColor(COLORS.secondary);
  doc.text(`Estudiante: ${userName}`, margin, yPos);
  yPos += 5;
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);
  yPos += 15;

  // Level section
  doc.setFillColor(COLORS.light);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'F');
  yPos += 10;

  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text(`Nivel ${progress.level}: ${progress.levelName}`, margin + 10, yPos);
  yPos += 8;

  doc.setFontSize(20);
  doc.setTextColor(COLORS.dark);
  doc.text(`${progress.totalPoints} puntos`, margin + 10, yPos);
  yPos += 25;

  // Stats grid
  doc.setFontSize(12);
  doc.setTextColor(COLORS.dark);
  doc.text('Estadísticas de estudio', margin, yPos);
  yPos += 10;

  const stats = [
    { label: 'Flashcards estudiadas', value: progress.totalFlashcardsStudied.toString() },
    { label: 'Quizzes completados', value: progress.totalQuizzesCompleted.toString() },
    { label: 'Racha actual', value: `${progress.currentStreak} días` },
    { label: 'Precisión en flashcards', value: `${Math.round(progress.flashcardAccuracy)}%` },
    { label: 'Promedio en quizzes', value: `${Math.round(progress.quizAverageScore)}%` },
  ];

  stats.forEach((stat) => {
    doc.setTextColor(COLORS.secondary);
    doc.setFontSize(10);
    doc.text(stat.label + ':', margin, yPos);
    doc.setTextColor(COLORS.dark);
    doc.setFontSize(11);
    doc.text(stat.value, margin + 80, yPos);
    yPos += 8;
  });

  yPos += 10;

  // Subject progress
  if (subjects && subjects.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(COLORS.dark);
    doc.text('Progreso por materia', margin, yPos);
    yPos += 10;

    subjects.forEach((subject) => {
      doc.setFontSize(10);
      doc.setTextColor(COLORS.secondary);
      doc.text(subject.name, margin, yPos);

      // Progress bar background
      doc.setFillColor(COLORS.light);
      doc.roundedRect(margin + 60, yPos - 4, 80, 6, 1, 1, 'F');

      // Progress bar fill
      doc.setFillColor(COLORS.primary);
      doc.roundedRect(margin + 60, yPos - 4, (subject.progress / 100) * 80, 6, 1, 1, 'F');

      // Percentage
      doc.setTextColor(COLORS.dark);
      doc.text(`${subject.progress}%`, margin + 145, yPos);
      yPos += 10;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text(
    'Generado por CampusMind - Tu campus inteligente',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`progreso-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export study summary to PDF (combines flashcards and quiz results)
 */
export function exportStudySummaryToPDF(
  subjectName: string,
  flashcards: FlashcardData[],
  quizResults?: { quizName: string; score: number; date: string }[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('CampusMind', margin, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setTextColor(COLORS.dark);
  doc.text(`Resumen de estudio: ${subjectName}`, margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);
  yPos += 15;

  // Flashcards summary
  doc.setFontSize(14);
  doc.setTextColor(COLORS.primary);
  doc.text('Flashcards', margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.text(`Total: ${flashcards.length} tarjetas`, margin, yPos);
  yPos += 5;

  const masteredCards = flashcards.filter((c) => (c.level || 0) >= 5).length;
  const learningCards = flashcards.filter((c) => (c.level || 0) >= 2 && (c.level || 0) < 5).length;
  const newCards = flashcards.filter((c) => (c.level || 0) < 2).length;

  doc.text(`Dominadas: ${masteredCards} | Aprendiendo: ${learningCards} | Nuevas: ${newCards}`, margin, yPos);
  yPos += 10;

  // Quiz results
  if (quizResults && quizResults.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(COLORS.primary);
    doc.text('Resultados de Quizzes', margin, yPos);
    yPos += 8;

    quizResults.forEach((result) => {
      doc.setFontSize(10);
      doc.setTextColor(COLORS.dark);
      doc.text(`${result.quizName}: ${result.score}%`, margin, yPos);
      doc.setTextColor(COLORS.secondary);
      doc.text(`(${result.date})`, margin + 80, yPos);
      yPos += 6;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text(
    'Generado por CampusMind - Tu campus inteligente',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  // Save
  doc.save(`resumen-${subjectName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
