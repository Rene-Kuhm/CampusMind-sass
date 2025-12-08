import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../rag/services/llm.service';

export interface EssayEvaluationResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  grammarIssues: string[];
  relevanceScore: number;
  coherenceScore: number;
  depthScore: number;
}

export interface EssayEvaluationInput {
  questionText: string;
  expectedCriteria?: string;
  studentAnswer: string;
  maxPoints: number;
  rubric?: {
    relevance: number;
    coherence: number;
    depth: number;
    grammar: number;
  };
}

@Injectable()
export class EssayEvaluationService {
  private readonly logger = new Logger(EssayEvaluationService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Evalúa un essay usando LLM
   */
  async evaluateEssay(input: EssayEvaluationInput): Promise<EssayEvaluationResult> {
    const rubric = input.rubric || {
      relevance: 30,
      coherence: 25,
      depth: 30,
      grammar: 15,
    };

    const prompt = this.buildEvaluationPrompt(input, rubric);

    try {
      const response = await this.llmService.generateWithFreeProvider(prompt, {
        maxTokens: 1500,
        temperature: 0.2,
      });

      return this.parseEvaluationResponse(response.content, input.maxPoints, rubric);
    } catch (error) {
      this.logger.error('Error evaluating essay with LLM', error);
      // Fallback: devolver evaluación pendiente
      return {
        score: 0,
        maxScore: input.maxPoints,
        percentage: 0,
        feedback: 'La evaluación automática no está disponible en este momento. Un instructor revisará tu respuesta.',
        strengths: [],
        improvements: ['Pendiente de revisión manual'],
        grammarIssues: [],
        relevanceScore: 0,
        coherenceScore: 0,
        depthScore: 0,
      };
    }
  }

  /**
   * Evalúa múltiples essays en batch
   */
  async evaluateEssaysBatch(
    essays: EssayEvaluationInput[],
  ): Promise<EssayEvaluationResult[]> {
    const results: EssayEvaluationResult[] = [];

    for (const essay of essays) {
      const result = await this.evaluateEssay(essay);
      results.push(result);
    }

    return results;
  }

  private buildEvaluationPrompt(
    input: EssayEvaluationInput,
    rubric: { relevance: number; coherence: number; depth: number; grammar: number },
  ): string {
    return `Eres un evaluador académico experto. Evalúa el siguiente ensayo de un estudiante.

PREGUNTA/TEMA:
${input.questionText}

${input.expectedCriteria ? `CRITERIOS ESPERADOS:\n${input.expectedCriteria}\n` : ''}

RESPUESTA DEL ESTUDIANTE:
${input.studentAnswer}

RÚBRICA DE EVALUACIÓN (total ${input.maxPoints} puntos):
- Relevancia (${rubric.relevance}%): ¿La respuesta aborda directamente la pregunta?
- Coherencia (${rubric.coherence}%): ¿Las ideas están bien organizadas y conectadas?
- Profundidad (${rubric.depth}%): ¿Demuestra comprensión profunda del tema?
- Gramática (${rubric.grammar}%): ¿La escritura es clara y sin errores?

INSTRUCCIONES:
Evalúa el ensayo y responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "relevanceScore": <número 0-100>,
  "coherenceScore": <número 0-100>,
  "depthScore": <número 0-100>,
  "grammarScore": <número 0-100>,
  "feedback": "<retroalimentación general constructiva en 2-3 oraciones>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"],
  "improvements": ["<área de mejora 1>", "<área de mejora 2>"],
  "grammarIssues": ["<problema gramatical si existe>"]
}

Responde SOLO con el JSON, sin texto adicional ni markdown.`;
  }

  private parseEvaluationResponse(
    content: string,
    maxPoints: number,
    rubric: { relevance: number; coherence: number; depth: number; grammar: number },
  ): EssayEvaluationResult {
    try {
      // Limpiar el contenido de posibles markdown
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const parsed = JSON.parse(cleanContent);

      // Calcular puntuación ponderada
      const relevanceScore = Math.min(100, Math.max(0, parsed.relevanceScore || 0));
      const coherenceScore = Math.min(100, Math.max(0, parsed.coherenceScore || 0));
      const depthScore = Math.min(100, Math.max(0, parsed.depthScore || 0));
      const grammarScore = Math.min(100, Math.max(0, parsed.grammarScore || 0));

      const weightedPercentage =
        (relevanceScore * rubric.relevance +
          coherenceScore * rubric.coherence +
          depthScore * rubric.depth +
          grammarScore * rubric.grammar) /
        100;

      const score = Math.round((weightedPercentage / 100) * maxPoints * 100) / 100;

      return {
        score,
        maxScore: maxPoints,
        percentage: Math.round(weightedPercentage * 100) / 100,
        feedback: parsed.feedback || 'Evaluación completada.',
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        grammarIssues: parsed.grammarIssues || [],
        relevanceScore,
        coherenceScore,
        depthScore,
      };
    } catch (error) {
      this.logger.error('Error parsing LLM evaluation response', error);
      // Fallback con evaluación parcial
      return {
        score: maxPoints * 0.5,
        maxScore: maxPoints,
        percentage: 50,
        feedback: 'Evaluación automática parcial. Considera revisión manual.',
        strengths: ['Respuesta enviada'],
        improvements: ['Verificar con instructor'],
        grammarIssues: [],
        relevanceScore: 50,
        coherenceScore: 50,
        depthScore: 50,
      };
    }
  }
}
