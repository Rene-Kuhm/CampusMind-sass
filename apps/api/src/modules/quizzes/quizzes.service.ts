import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreateQuizDto,
  UpdateQuizDto,
  CreateQuestionDto,
  SubmitQuizDto,
  QuestionType,
  DifficultyLevel,
} from "./dto/quiz.dto";
import { EssayEvaluationService } from "./essay-evaluation.service";
import { UsageLimitsService } from "../billing/services/usage-limits.service";
import { UsageTypeEnum } from "../billing/constants/plans.constant";

// Tipos extendidos para Prisma
type PrismaWithQuizzes = PrismaService & {
  quiz: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
  };
  quizQuestion: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    createMany: (args: any) => Promise<any>;
  };
  quizAttempt: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
    aggregate: (args: any) => Promise<any>;
  };
};

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  subjectId?: string | null;
  timeLimitMinutes?: number | null;
  passingScore: number;
  showAnswers: boolean;
  shuffleQuestions: boolean;
  questionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  text: string;
  type: QuestionType;
  options: any;
  correctAnswer?: string | null;
  explanation?: string | null;
  difficulty: DifficultyLevel;
  points: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  answers: any;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeSpentMinutes?: number | null;
  completedAt: Date;
}

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);
  private readonly prisma: PrismaWithQuizzes;

  constructor(
    prisma: PrismaService,
    private readonly essayEvaluationService: EssayEvaluationService,
    private readonly usageLimitsService: UsageLimitsService,
  ) {
    this.prisma = prisma as PrismaWithQuizzes;
  }

  // ==================== QUIZ OPERATIONS ====================

  /**
   * Crear un nuevo quiz
   */
  async createQuiz(userId: string, dto: CreateQuizDto): Promise<Quiz> {
    // Verificar límite de quizzes
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.QUIZZES,
      "Has alcanzado el límite de quizzes de tu plan. Mejora tu plan para crear más.",
    );

    // Validar materia si se proporciona
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        timeLimitMinutes: dto.timeLimitMinutes,
        passingScore: dto.passingScore ?? 60,
        showAnswers: dto.showAnswers ?? true,
        shuffleQuestions: dto.shuffleQuestions ?? false,
      },
    });

    // Crear preguntas si se proporcionan
    if (dto.questions && dto.questions.length > 0) {
      for (let i = 0; i < dto.questions.length; i++) {
        await this.addQuestion(quiz.id, userId, dto.questions[i], i);
      }
    }

    // Incrementar uso de quizzes
    await this.usageLimitsService.incrementUsage(userId, UsageTypeEnum.QUIZZES);

    return { ...quiz, questionCount: dto.questions?.length || 0 } as Quiz;
  }

  /**
   * Obtener quizzes del usuario
   */
  async getQuizzes(userId: string, subjectId?: string): Promise<Quiz[]> {
    const where: any = { userId };
    if (subjectId) {
      where.subjectId = subjectId;
    }

    const quizzes = await this.prisma.quiz.findMany({
      where,
      include: {
        _count: {
          select: { questions: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return quizzes.map((q: any) => ({
      ...q,
      questionCount: q._count.questions,
    })) as Quiz[];
  }

  /**
   * Obtener quiz por ID
   */
  async getQuiz(quizId: string, userId: string): Promise<Quiz> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, userId },
      include: {
        _count: {
          select: { questions: true },
        },
        subject: {
          select: { id: true, name: true },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException("Quiz no encontrado");
    }

    return { ...quiz, questionCount: quiz._count.questions } as Quiz;
  }

  /**
   * Obtener quiz con preguntas para tomar el examen
   */
  async getQuizWithQuestions(
    quizId: string,
    userId: string,
  ): Promise<Quiz & { questions: QuizQuestion[] }> {
    const quiz = await this.getQuiz(quizId, userId);

    let questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
    });

    // Mezclar preguntas si está habilitado
    if (quiz.shuffleQuestions) {
      questions = this.shuffleArray([...questions]);
    }

    // Ocultar respuestas correctas
    const sanitizedQuestions = questions.map((q: any) => ({
      id: q.id,
      quizId: q.quizId,
      text: q.text,
      type: q.type,
      options: q.options?.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        // No incluir isCorrect
      })),
      difficulty: q.difficulty,
      points: q.points,
      order: q.order,
    }));

    return { ...quiz, questions: sanitizedQuestions as QuizQuestion[] };
  }

  /**
   * Actualizar quiz
   */
  async updateQuiz(
    quizId: string,
    userId: string,
    dto: UpdateQuizDto,
  ): Promise<Quiz> {
    await this.getQuiz(quizId, userId);

    const quiz = await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.timeLimitMinutes !== undefined && {
          timeLimitMinutes: dto.timeLimitMinutes,
        }),
        ...(dto.passingScore !== undefined && {
          passingScore: dto.passingScore,
        }),
        ...(dto.showAnswers !== undefined && { showAnswers: dto.showAnswers }),
        ...(dto.shuffleQuestions !== undefined && {
          shuffleQuestions: dto.shuffleQuestions,
        }),
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    return { ...quiz, questionCount: quiz._count.questions } as Quiz;
  }

  /**
   * Eliminar quiz
   */
  async deleteQuiz(quizId: string, userId: string): Promise<void> {
    await this.getQuiz(quizId, userId);
    await this.prisma.quiz.delete({ where: { id: quizId } });
  }

  // ==================== QUESTION OPERATIONS ====================

  /**
   * Agregar pregunta a un quiz
   */
  async addQuestion(
    quizId: string,
    userId: string,
    dto: CreateQuestionDto,
    order?: number,
  ): Promise<QuizQuestion> {
    await this.getQuiz(quizId, userId);

    // Calcular orden si no se proporciona
    if (order === undefined) {
      const lastQuestion = await this.prisma.quizQuestion.findFirst({
        where: { quizId },
        orderBy: { order: "desc" },
      });
      order = (lastQuestion?.order ?? -1) + 1;
    }

    // Preparar opciones para multiple choice/true false
    let options = null;
    if (dto.options && dto.options.length > 0) {
      options = dto.options.map((opt, i) => ({
        id: `opt_${Date.now()}_${i}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      }));
    }

    const question = await this.prisma.quizQuestion.create({
      data: {
        quizId,
        text: dto.text,
        type: dto.type,
        options,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        difficulty: dto.difficulty || DifficultyLevel.MEDIUM,
        points: dto.points || 1,
        order,
      },
    });

    return question as QuizQuestion;
  }

  /**
   * Obtener preguntas de un quiz
   */
  async getQuestions(quizId: string, userId: string): Promise<QuizQuestion[]> {
    await this.getQuiz(quizId, userId);

    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: "asc" },
    });

    return questions as QuizQuestion[];
  }

  /**
   * Eliminar pregunta
   */
  async deleteQuestion(questionId: string, userId: string): Promise<void> {
    const question = await this.prisma.quizQuestion.findFirst({
      where: { id: questionId },
      include: { quiz: { select: { userId: true } } },
    });

    if (!question || question.quiz.userId !== userId) {
      throw new NotFoundException("Pregunta no encontrada");
    }

    await this.prisma.quizQuestion.delete({ where: { id: questionId } });
  }

  // ==================== QUIZ ATTEMPTS ====================

  /**
   * Enviar respuestas y calificar quiz
   */
  async submitQuiz(
    quizId: string,
    userId: string,
    dto: SubmitQuizDto,
  ): Promise<QuizAttempt> {
    const quiz = await this.getQuiz(quizId, userId);

    // Obtener preguntas con respuestas correctas
    const questions = await this.prisma.quizQuestion.findMany({
      where: { quizId },
    });

    // Calcular puntuación
    let score = 0;
    let totalPoints = 0;
    const gradedAnswers: any[] = [];

    for (const question of questions) {
      totalPoints += question.points;

      const userAnswer = dto.answers.find((a) => a.questionId === question.id);

      const graded: any = {
        questionId: question.id,
        questionText: question.text,
        userAnswer: null,
        isCorrect: false,
        points: 0,
        maxPoints: question.points,
      };

      if (userAnswer) {
        const options = question.options as Array<{
          id: string;
          text: string;
          isCorrect: boolean;
        }> | null;

        if (
          question.type === QuestionType.MULTIPLE_CHOICE ||
          question.type === QuestionType.TRUE_FALSE
        ) {
          // Verificar opción seleccionada
          const selectedOption = options?.find(
            (opt) => opt.id === userAnswer.selectedOptionId,
          );
          graded.userAnswer = selectedOption?.text;
          graded.isCorrect = selectedOption?.isCorrect === true;

          if (graded.isCorrect) {
            score += question.points;
            graded.points = question.points;
          }
        } else if (question.type === QuestionType.SHORT_ANSWER) {
          // Comparación simple para short answer
          const normalizedUser = userAnswer.textAnswer?.toLowerCase().trim();
          const normalizedCorrect = question.correctAnswer
            ?.toLowerCase()
            .trim();
          graded.userAnswer = userAnswer.textAnswer;
          graded.isCorrect = normalizedUser === normalizedCorrect;

          if (graded.isCorrect) {
            score += question.points;
            graded.points = question.points;
          }
        } else if (question.type === QuestionType.ESSAY) {
          // Evaluación automática de essays con LLM
          graded.userAnswer = userAnswer.textAnswer;

          if (
            userAnswer.textAnswer &&
            userAnswer.textAnswer.trim().length > 0
          ) {
            try {
              const evaluation =
                await this.essayEvaluationService.evaluateEssay({
                  questionText: question.text,
                  expectedCriteria: question.correctAnswer || undefined,
                  studentAnswer: userAnswer.textAnswer,
                  maxPoints: question.points,
                });

              graded.isCorrect = evaluation.percentage >= 60;
              graded.points = evaluation.score;
              score += evaluation.score;
              graded.essayEvaluation = {
                feedback: evaluation.feedback,
                strengths: evaluation.strengths,
                improvements: evaluation.improvements,
                relevanceScore: evaluation.relevanceScore,
                coherenceScore: evaluation.coherenceScore,
                depthScore: evaluation.depthScore,
              };
            } catch (error) {
              this.logger.error("Error evaluating essay", error);
              graded.isCorrect = null;
              graded.essayEvaluation = {
                feedback: "Pendiente de revisión manual",
                strengths: [],
                improvements: [],
              };
            }
          } else {
            graded.isCorrect = false;
            graded.points = 0;
          }
        }

        // Agregar explicación si está disponible
        if (quiz.showAnswers && question.explanation) {
          graded.explanation = question.explanation;
        }

        // Agregar respuesta correcta si está habilitado
        if (quiz.showAnswers) {
          if (options) {
            graded.correctAnswer = options.find((opt) => opt.isCorrect)?.text;
          } else {
            graded.correctAnswer = question.correctAnswer;
          }
        }
      }

      gradedAnswers.push(graded);
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Guardar intento
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        answers: gradedAnswers,
        score,
        totalPoints,
        percentage,
        passed,
        timeSpentMinutes: dto.timeSpentMinutes,
      },
    });

    return attempt as QuizAttempt;
  }

  /**
   * Obtener intentos de un quiz
   */
  async getAttempts(quizId: string, userId: string): Promise<QuizAttempt[]> {
    await this.getQuiz(quizId, userId);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { completedAt: "desc" },
    });

    return attempts as QuizAttempt[];
  }

  /**
   * Obtener intento específico
   */
  async getAttempt(attemptId: string, userId: string): Promise<QuizAttempt> {
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        quiz: {
          select: { title: true, showAnswers: true },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException("Intento no encontrado");
    }

    return attempt as QuizAttempt;
  }

  /**
   * Obtener estadísticas de quiz
   */
  async getQuizStats(
    quizId: string,
    userId: string,
  ): Promise<{
    totalAttempts: number;
    averageScore: number;
    averagePercentage: number;
    passRate: number;
    bestScore: number;
    averageTime: number;
  }> {
    await this.getQuiz(quizId, userId);

    const [totalAttempts, stats, passedCount] = await Promise.all([
      this.prisma.quizAttempt.count({ where: { quizId, userId } }),
      this.prisma.quizAttempt.aggregate({
        where: { quizId, userId },
        _avg: {
          score: true,
          percentage: true,
          timeSpentMinutes: true,
        },
        _max: {
          score: true,
        },
      }),
      this.prisma.quizAttempt.count({
        where: { quizId, userId, passed: true },
      }),
    ]);

    return {
      totalAttempts,
      averageScore: stats._avg?.score || 0,
      averagePercentage: stats._avg?.percentage || 0,
      passRate: totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0,
      bestScore: stats._max?.score || 0,
      averageTime: stats._avg?.timeSpentMinutes || 0,
    };
  }

  /**
   * Obtener estadísticas generales del usuario
   */
  async getUserStats(userId: string): Promise<{
    totalQuizzes: number;
    totalAttempts: number;
    averagePercentage: number;
    passRate: number;
  }> {
    const [quizzes, attempts, passedAttempts, avgPercentage] =
      await Promise.all([
        this.prisma.quiz.findMany({
          where: { userId },
          select: { id: true },
        }),
        this.prisma.quizAttempt.count({ where: { userId } }),
        this.prisma.quizAttempt.count({ where: { userId, passed: true } }),
        this.prisma.quizAttempt.aggregate({
          where: { userId },
          _avg: { percentage: true },
        }),
      ]);

    return {
      totalQuizzes: quizzes.length,
      totalAttempts: attempts,
      averagePercentage: avgPercentage._avg?.percentage || 0,
      passRate: attempts > 0 ? (passedAttempts / attempts) * 100 : 0,
    };
  }

  // ==================== UTILITIES ====================

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
