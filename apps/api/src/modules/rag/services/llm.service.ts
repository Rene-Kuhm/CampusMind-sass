import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { LlmOptions, LlmResponse } from '../interfaces/rag.interface';

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: { total_tokens: number };
}

/**
 * Servicio de LLM con abstracción para múltiples proveedores
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly provider: string;
  private readonly model: string;
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.provider = this.config.get<string>('LLM_PROVIDER', 'openai');
    this.model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.apiKey = this.config.get<string>('OPENAI_API_KEY', '');
  }

  /**
   * Genera una respuesta del LLM
   */
  async generateCompletion(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    switch (this.provider) {
      case 'openai':
        return this.generateOpenAI(prompt, options);
      // Agregar más proveedores (Anthropic, etc.)
      default:
        return this.generateOpenAI(prompt, options);
    }
  }

  /**
   * Genera respuesta con contexto RAG
   */
  async generateWithContext(
    query: string,
    context: string[],
    options?: {
      style?: 'formal' | 'practical' | 'balanced';
      depth?: 'basic' | 'intermediate' | 'advanced';
      language?: string;
    },
  ): Promise<LlmResponse> {
    const systemPrompt = this.buildSystemPrompt(options);
    const contextText = context
      .map((c, i) => `[Fuente ${i + 1}]:\n${c}`)
      .join('\n\n---\n\n');

    const prompt = `
Basándote ÚNICAMENTE en el siguiente contexto académico, responde la pregunta del estudiante.

CONTEXTO:
${contextText}

PREGUNTA DEL ESTUDIANTE:
${query}

INSTRUCCIONES:
1. Responde de forma clara y estructurada
2. Cita las fuentes usando [Fuente N] cuando uses información específica
3. Si el contexto no contiene información suficiente, indícalo claramente
4. No inventes información que no esté en el contexto
5. Usa el tono y profundidad apropiados según el perfil del estudiante

RESPUESTA:`;

    return this.generateCompletion(prompt, {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.3,
    });
  }

  /**
   * Genera un resumen estilo Harvard
   */
  async generateHarvardSummary(
    content: string,
    options?: {
      depth?: 'basic' | 'intermediate' | 'advanced';
      language?: string;
    },
  ): Promise<LlmResponse> {
    const depth = options?.depth || 'intermediate';
    const language = options?.language || 'es';

    const prompt = `
Genera un resumen académico estilo Harvard del siguiente contenido.

CONTENIDO:
${content}

ESTRUCTURA REQUERIDA (responde en formato JSON):
{
  "theoreticalContext": "Contexto teórico y marco conceptual (2-3 párrafos)",
  "keyIdeas": ["Idea clave 1", "Idea clave 2", ...],
  "definitions": [
    {"term": "Término", "definition": "Definición clara", "formula": "Fórmula si aplica"}
  ],
  "examples": [
    {"description": "Descripción del ejemplo", "solution": "Solución paso a paso si aplica"}
  ],
  "commonMistakes": ["Error común 1 y cómo evitarlo", ...],
  "reviewChecklist": ["✓ Punto de repaso 1", "✓ Punto de repaso 2", ...],
  "references": ["Referencia implícita del contenido"]
}

NIVEL DE PROFUNDIDAD: ${depth}
IDIOMA: ${language}

Responde SOLO con el JSON válido, sin texto adicional.`;

    return this.generateCompletion(prompt, {
      maxTokens: 3000,
      temperature: 0.2,
    });
  }

  private async generateOpenAI(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response: AxiosResponse<OpenAIChatResponse> = await firstValueFrom(
        this.http.post<OpenAIChatResponse>(
          'https://api.openai.com/v1/chat/completions',
          {
            model: this.model,
            messages,
            max_tokens: options?.maxTokens || 1000,
            temperature: options?.temperature ?? 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data: OpenAIChatResponse = response.data;

      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage.total_tokens,
        finishReason: data.choices[0].finish_reason,
      };
    } catch (error) {
      this.logger.error(`OpenAI completion failed: ${error}`);
      throw new Error('Failed to generate LLM response');
    }
  }

  private buildSystemPrompt(options?: {
    style?: 'formal' | 'practical' | 'balanced';
    depth?: 'basic' | 'intermediate' | 'advanced';
    language?: string;
  }): string {
    const style = options?.style || 'balanced';
    const depth = options?.depth || 'intermediate';
    const language = options?.language || 'es';

    const styleGuide = {
      formal:
        'Usa un tono académico formal, con terminología técnica precisa y estructura rigurosa.',
      practical:
        'Enfócate en aplicaciones prácticas, usa ejemplos concretos y lenguaje accesible.',
      balanced:
        'Combina rigor académico con claridad práctica, equilibrando teoría y aplicación.',
    };

    const depthGuide = {
      basic:
        'Explica los conceptos de forma introductoria, asumiendo poco conocimiento previo.',
      intermediate:
        'Asume conocimientos básicos y profundiza en detalles importantes.',
      advanced:
        'Profundiza en aspectos técnicos avanzados, asumiendo dominio del tema.',
    };

    return `Eres CampusMind, un copiloto académico experto que ayuda a estudiantes universitarios.

ESTILO: ${styleGuide[style]}
PROFUNDIDAD: ${depthGuide[depth]}
IDIOMA: Responde en ${language === 'es' ? 'español' : language}

PRINCIPIOS:
- Siempre cita tus fuentes cuando uses información del contexto
- Sé preciso y evita información incorrecta
- Si no sabes algo o el contexto es insuficiente, admítelo
- Estructura tus respuestas de forma clara y organizada
- Adapta tu lenguaje al nivel del estudiante`;
  }
}
