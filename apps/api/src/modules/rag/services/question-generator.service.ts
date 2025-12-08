import { Injectable, Logger } from "@nestjs/common";
import { LlmService } from "./llm.service";

export interface GeneratedQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic?: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  tags: string[];
}

export interface QuestionGenerationOptions {
  count?: number;
  types?: Array<
    "multiple_choice" | "true_false" | "short_answer" | "fill_blank"
  >;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  language?: string;
}

export interface FlashcardGenerationOptions {
  count?: number;
  includeFormulas?: boolean;
  language?: string;
}

/**
 * Service for auto-generating study questions and flashcards from content
 * Uses LLM to create intelligent, contextual questions
 */
@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(private readonly llm: LlmService) {}

  /**
   * Generate study questions from content
   */
  async generateQuestions(
    content: string,
    options?: QuestionGenerationOptions,
  ): Promise<GeneratedQuestion[]> {
    const count = options?.count || 5;
    const types = options?.types || [
      "multiple_choice",
      "true_false",
      "short_answer",
    ];
    const difficulty = options?.difficulty || "mixed";
    const language = options?.language || "es";

    const prompt = `
Eres un experto en educación. Genera ${count} preguntas de estudio basadas en el siguiente contenido académico.

CONTENIDO:
${content}

REQUISITOS:
- Tipos de preguntas a incluir: ${types.join(", ")}
- Dificultad: ${difficulty === "mixed" ? "mezcla de fácil, media y difícil" : difficulty}
- Idioma: ${language === "es" ? "español" : language}
- Cada pregunta debe tener una explicación de la respuesta correcta
- Para multiple_choice: incluye 4 opciones (A, B, C, D)
- Para true_false: la respuesta es "Verdadero" o "Falso"
- Para short_answer: respuesta breve de 1-2 oraciones
- Para fill_blank: usa ___ para indicar el espacio en blanco

Responde SOLO con un JSON válido con esta estructura:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "¿Pregunta aquí?",
      "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
      "correctAnswer": "A",
      "explanation": "Explicación de por qué A es correcta",
      "difficulty": "easy",
      "topic": "Tema relacionado"
    }
  ]
}
`;

    try {
      const response = await this.llm.generateWithFreeProvider(prompt, {
        maxTokens: 3000,
        temperature: 0.7,
      });

      const parsed = this.parseJSONResponse(response.content) as {
        questions?: GeneratedQuestion[];
      };
      return parsed.questions || [];
    } catch (error) {
      this.logger.error(
        `Question generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      return [];
    }
  }

  /**
   * Generate flashcards from content
   */
  async generateFlashcards(
    content: string,
    options?: FlashcardGenerationOptions,
  ): Promise<GeneratedFlashcard[]> {
    const count = options?.count || 10;
    const language = options?.language || "es";

    const prompt = `
Eres un experto en técnicas de estudio. Genera ${count} flashcards efectivas basadas en el siguiente contenido académico.

CONTENIDO:
${content}

REQUISITOS:
- Idioma: ${language === "es" ? "español" : language}
- Cada flashcard debe tener:
  - front: La pregunta o concepto (breve, claro)
  - back: La respuesta o definición (concisa pero completa)
  - tags: Etiquetas relevantes para categorizar
- Incluye conceptos clave, definiciones, fórmulas si hay
- Las preguntas deben promover la memoria activa
- Evita flashcards demasiado largas

Responde SOLO con un JSON válido con esta estructura:
{
  "flashcards": [
    {
      "front": "¿Qué es X?",
      "back": "X es...",
      "tags": ["concepto", "definición"]
    }
  ]
}
`;

    try {
      const response = await this.llm.generateWithFreeProvider(prompt, {
        maxTokens: 2500,
        temperature: 0.6,
      });

      const parsed = this.parseJSONResponse(response.content) as {
        flashcards?: GeneratedFlashcard[];
      };
      return parsed.flashcards || [];
    } catch (error) {
      this.logger.error(
        `Flashcard generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      return [];
    }
  }

  /**
   * Generate a study guide from content
   */
  async generateStudyGuide(
    content: string,
    title: string,
    options?: { language?: string },
  ): Promise<{
    summary: string;
    keyPoints: string[];
    concepts: Array<{ term: string; definition: string }>;
    studyTips: string[];
  }> {
    const language = options?.language || "es";

    const prompt = `
Eres un tutor académico experto. Genera una guía de estudio completa para el siguiente contenido.

TÍTULO: ${title}

CONTENIDO:
${content}

Genera una guía de estudio con:
1. Un resumen ejecutivo (2-3 párrafos)
2. Puntos clave (5-10 puntos principales)
3. Conceptos importantes con definiciones
4. Tips de estudio específicos para este tema

Responde SOLO con un JSON válido con esta estructura:
{
  "summary": "Resumen aquí...",
  "keyPoints": ["Punto 1", "Punto 2", ...],
  "concepts": [
    {"term": "Concepto 1", "definition": "Definición..."}
  ],
  "studyTips": ["Tip 1", "Tip 2", ...]
}

Idioma: ${language === "es" ? "español" : language}
`;

    try {
      const response = await this.llm.generateWithFreeProvider(prompt, {
        maxTokens: 3000,
        temperature: 0.5,
      });

      interface StudyGuideResponse {
        summary?: string;
        keyPoints?: string[];
        concepts?: Array<{ term: string; definition: string }>;
        studyTips?: string[];
      }

      const parsed = this.parseJSONResponse(
        response.content,
      ) as StudyGuideResponse;
      return {
        summary: parsed.summary || "",
        keyPoints: parsed.keyPoints || [],
        concepts: parsed.concepts || [],
        studyTips: parsed.studyTips || [],
      };
    } catch (error) {
      this.logger.error(
        `Study guide generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      return {
        summary: "",
        keyPoints: [],
        concepts: [],
        studyTips: [],
      };
    }
  }

  /**
   * Generate a podcast script from content (for TTS)
   */
  async generatePodcastScript(
    content: string,
    title: string,
    options?: {
      style?: "formal" | "casual";
      duration?: "short" | "medium" | "long";
    },
  ): Promise<string> {
    const style = options?.style || "casual";
    const duration = options?.duration || "medium";

    const durationGuide = {
      short: "2-3 minutos de lectura",
      medium: "5-7 minutos de lectura",
      long: "10-15 minutos de lectura",
    };

    const prompt = `
Eres un creador de contenido educativo. Convierte el siguiente material académico en un script para un podcast de estudio.

TÍTULO: ${title}

CONTENIDO:
${content}

REQUISITOS:
- Estilo: ${style === "casual" ? "conversacional y amigable" : "profesional y académico"}
- Duración: ${durationGuide[duration]}
- Estructura:
  1. Introducción enganchante
  2. Desarrollo de los puntos principales
  3. Ejemplos o analogías para clarificar
  4. Resumen de puntos clave
  5. Cierre motivacional

- NO uses marcadores como "Slide 1" o "Punto 1:"
- Escribe como si estuvieras hablando directamente al estudiante
- Incluye pausas naturales (usa "..." para pausas)
- Hazlo interesante y fácil de seguir

Responde SOLO con el script, sin formato JSON.
`;

    try {
      const response = await this.llm.generateWithFreeProvider(prompt, {
        maxTokens: 2500,
        temperature: 0.7,
      });

      return response.content;
    } catch (error) {
      this.logger.error(
        `Podcast script generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      return `Error al generar el script. Por favor intenta de nuevo.`;
    }
  }

  /**
   * Parse JSON from LLM response (handles markdown code blocks)
   */
  private parseJSONResponse(content: string): Record<string, unknown> {
    try {
      // Try direct parse first
      return JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch {
          // Continue to next attempt
        }
      }

      // Try to find JSON object in content
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          // Continue to fallback
        }
      }

      this.logger.warn("Could not parse JSON from LLM response");
      return {};
    }
  }
}
