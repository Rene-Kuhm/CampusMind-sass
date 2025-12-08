import { HttpService } from '@nestjs/axios';
import { BaseLlmProvider } from './base.provider';
import { LlmOptions, LlmResponse, LlmProviderType } from '../interfaces/rag.interface';

interface GroqResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Groq Provider (FREE with very fast inference!)
 * Uses OpenAI-compatible API
 *
 * Models (all FREE):
 * - llama-3.3-70b-versatile: Best quality, fast
 * - llama-3.1-8b-instant: Fastest, good for simple tasks
 * - mixtral-8x7b-32768: Good balance, 32k context
 * - gemma2-9b-it: Google's Gemma, instruction-tuned
 *
 * Free limits: 30 RPM, 14,400 RPD
 */
export class GroqProvider extends BaseLlmProvider {
  readonly providerType: LlmProviderType = 'groq';

  constructor(http: HttpService, apiKey: string, model: string) {
    super(http, apiKey, model, 'https://api.groq.com/openai/v1');
  }

  async generateCompletion(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const messages = this.buildMessages(prompt, options?.systemPrompt);
    const modelToUse = options?.model || this.model;

    const response = await this.makeRequest<GroqResponse>(
      `${this.baseUrl}/chat/completions`,
      {
        model: modelToUse,
        messages,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature ?? 0.7,
      },
      {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    );

    return {
      content: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens,
      finishReason: response.choices[0].finish_reason,
      provider: this.providerType,
      model: modelToUse,
    };
  }
}
