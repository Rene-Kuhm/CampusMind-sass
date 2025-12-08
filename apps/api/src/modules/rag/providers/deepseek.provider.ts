import { HttpService } from '@nestjs/axios';
import { BaseLlmProvider } from './base.provider';
import { LlmOptions, LlmResponse, LlmProviderType } from '../interfaces/rag.interface';

interface DeepSeekResponse {
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
 * DeepSeek Provider (Very cheap! ~$0.14/1M tokens)
 * Uses OpenAI-compatible API
 *
 * Models:
 * - deepseek-chat: General purpose
 * - deepseek-coder: Code-optimized
 */
export class DeepSeekProvider extends BaseLlmProvider {
  readonly providerType: LlmProviderType = 'deepseek';

  constructor(http: HttpService, apiKey: string, model: string) {
    super(http, apiKey, model, 'https://api.deepseek.com');
  }

  async generateCompletion(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const messages = this.buildMessages(prompt, options?.systemPrompt);
    const modelToUse = options?.model || this.model;

    const response = await this.makeRequest<DeepSeekResponse>(
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
