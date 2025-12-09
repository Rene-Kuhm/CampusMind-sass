import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudyPlanDto, GeneratePlanDto, UpdatePlanItemDto, DifficultyLevel } from './dto';
import axios from 'axios';

@Injectable()
export class StudyPlansService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async createPlan(userId: string, dto: CreateStudyPlanDto) {
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    return this.prisma.studyPlan.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        examDate: dto.examDate ? new Date(dto.examDate) : null,
        difficulty: dto.difficulty || 'MEDIUM',
        hoursPerDay: dto.hoursPerDay || 2,
        daysPerWeek: dto.daysPerWeek || 5,
        includeBreaks: dto.includeBreaks ?? true,
        preferredTimes: dto.preferredTimes || ['afternoon'],
      },
      include: {
        subject: { select: { id: true, name: true } },
        items: { orderBy: { scheduledDate: 'asc' } },
      },
    });
  }

  async generateWithAI(userId: string, dto: GeneratePlanDto) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, userId },
      include: {
        resources: { select: { title: true, type: true } },
        flashcardDecks: { select: { name: true, _count: { select: { flashcards: true } } } },
        quizzes: { select: { title: true } },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    const examDate = new Date(dto.examDate);
    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExam < 1) {
      throw new NotFoundException('Exam date must be in the future');
    }

    // Generate plan with AI
    const plan = await this.generatePlanWithLLM(
      subject,
      daysUntilExam,
      dto.hoursPerDay || 2,
      dto.difficulty || 'MEDIUM',
      dto.preferredTimes || ['afternoon'],
    );

    // Create plan in database
    const studyPlan = await this.prisma.studyPlan.create({
      data: {
        userId,
        subjectId: dto.subjectId,
        title: `Plan de estudio: ${subject.name}`,
        description: `Plan generado por IA para preparar el examen de ${subject.name}`,
        examDate,
        difficulty: dto.difficulty || 'MEDIUM',
        hoursPerDay: dto.hoursPerDay || 2,
        daysPerWeek: 5,
        includeBreaks: true,
        preferredTimes: dto.preferredTimes || ['afternoon'],
        aiGenerated: true,
        aiModel: 'gpt-4o-mini',
        items: {
          create: plan.items.map((item: any, index: number) => ({
            title: item.title,
            description: item.description,
            type: item.type,
            scheduledDate: new Date(item.date),
            duration: item.duration,
            order: index,
            resourceIds: item.resourceIds || [],
          })),
        },
      },
      include: {
        subject: { select: { id: true, name: true } },
        items: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    return studyPlan;
  }

  private async generatePlanWithLLM(
    subject: any,
    daysUntilExam: number,
    hoursPerDay: number,
    difficulty: string,
    preferredTimes: string[],
  ) {
    const apiKey = this.config.get('OPENAI_API_KEY') || this.config.get('GOOGLE_AI_API_KEY');

    const resourcesList = subject.resources.map((r: any) => `- ${r.title} (${r.type})`).join('\n');
    const decksList = subject.flashcardDecks.map((d: any) => `- ${d.name} (${d._count.flashcards} tarjetas)`).join('\n');

    const prompt = `Genera un plan de estudio detallado para preparar un examen.

INFORMACIÓN:
- Materia: ${subject.name}
- Días hasta el examen: ${daysUntilExam}
- Horas de estudio por día: ${hoursPerDay}
- Dificultad del contenido: ${difficulty}
- Horarios preferidos: ${preferredTimes.join(', ')}

RECURSOS DISPONIBLES:
${resourcesList || 'No hay recursos específicos'}

MAZOS DE FLASHCARDS:
${decksList || 'No hay flashcards'}

INSTRUCCIONES:
1. Distribuye el contenido de manera progresiva (de lo básico a lo complejo)
2. Incluye sesiones de repaso espaciado
3. Alterna entre diferentes tipos de actividades
4. Incluye descansos cortos cada 25-45 min
5. Deja los últimos 2-3 días para repaso general

Responde en JSON con este formato:
{
  "items": [
    {
      "title": "Título de la actividad",
      "description": "Descripción detallada",
      "type": "READING|VIDEO|PRACTICE|REVIEW|FLASHCARDS|QUIZ|SUMMARY|BREAK|EXAM_PREP",
      "date": "YYYY-MM-DD",
      "duration": 30,
      "resourceIds": []
    }
  ]
}

Genera suficientes items para cubrir ${daysUntilExam} días con ${hoursPerDay} horas por día.`;

    try {
      if (this.config.get('OPENAI_API_KEY')) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          },
          {
            headers: { Authorization: `Bearer ${this.config.get('OPENAI_API_KEY')}` },
          },
        );

        return JSON.parse(response.data.choices[0].message.content);
      }

      // Fallback to Gemini
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.get('GOOGLE_AI_API_KEY')}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        },
      );

      return JSON.parse(response.data.candidates[0].content.parts[0].text);
    } catch (error) {
      console.error('AI plan generation error:', error);
      // Return a basic plan
      return this.generateBasicPlan(daysUntilExam, hoursPerDay);
    }
  }

  private generateBasicPlan(days: number, hoursPerDay: number) {
    const items = [];
    const today = new Date();

    for (let day = 0; day < days; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      // Morning session
      items.push({
        title: `Sesión de estudio - Día ${day + 1}`,
        description: 'Lectura y comprensión del material',
        type: 'READING',
        date: dateStr,
        duration: Math.round(hoursPerDay * 60 * 0.4),
      });

      // Practice
      items.push({
        title: 'Práctica y ejercicios',
        description: 'Resolver ejercicios y problemas',
        type: 'PRACTICE',
        date: dateStr,
        duration: Math.round(hoursPerDay * 60 * 0.3),
      });

      // Review
      items.push({
        title: 'Repaso con flashcards',
        description: 'Revisar tarjetas de memoria',
        type: 'FLASHCARDS',
        date: dateStr,
        duration: Math.round(hoursPerDay * 60 * 0.3),
      });
    }

    return { items };
  }

  async getPlans(userId: string, subjectId?: string) {
    return this.prisma.studyPlan.findMany({
      where: {
        userId,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPlan(userId: string, id: string) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
      include: {
        subject: { select: { id: true, name: true } },
        items: { orderBy: { scheduledDate: 'asc' } },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Calculate progress
    const completedItems = plan.items.filter((i) => i.isCompleted).length;
    const progress = plan.items.length > 0 ? (completedItems / plan.items.length) * 100 : 0;

    return {
      ...plan,
      progress: Math.round(progress),
      completedItems,
      totalItems: plan.items.length,
    };
  }

  async updatePlanItem(userId: string, itemId: string, dto: UpdatePlanItemDto) {
    const item = await this.prisma.studyPlanItem.findFirst({
      where: { id: itemId },
      include: { plan: true },
    });

    if (!item || item.plan.userId !== userId) {
      throw new NotFoundException('Item not found');
    }

    const updated = await this.prisma.studyPlanItem.update({
      where: { id: itemId },
      data: {
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted ? new Date() : null,
        notes: dto.notes,
      },
    });

    // Update plan progress
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id: item.planId },
      include: { items: true },
    });

    if (plan) {
      const completedItems = plan.items.filter((i) => i.isCompleted).length;
      const progress = (completedItems / plan.items.length) * 100;

      await this.prisma.studyPlan.update({
        where: { id: plan.id },
        data: {
          progress,
          status: progress >= 100 ? 'COMPLETED' : 'ACTIVE',
        },
      });
    }

    return updated;
  }

  async deletePlan(userId: string, id: string) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    await this.prisma.studyPlan.delete({ where: { id } });
    return { success: true };
  }

  async getTodayItems(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.studyPlanItem.findMany({
      where: {
        plan: { userId, status: 'ACTIVE' },
        scheduledDate: { gte: today, lt: tomorrow },
      },
      include: {
        plan: {
          select: { id: true, title: true, subject: { select: { name: true, color: true } } },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}
