import { HttpService } from '@nestjs/axios';
import { BaseLlmProvider } from './base.provider';
import { LlmOptions, LlmResponse, LlmProviderType } from '../interfaces/rag.interface';

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  usage: { total_tokens: number };
}

/**
 * OpenAI Provider (GPT-4, GPT-3.5)
 */
export class OpenAIProvider extends BaseLlmProvider {
  readonly providerType: LlmProviderType = 'openai';

  constructor(http: HttpService, apiKey: string, model: string) {
    super(http, apiKey, model, 'https://api.openai.com/v1');
  }

  async generateCompletion(prompt: string, options?: LlmOptions): Promise<LlmResponse> {
    const messages = this.buildMessages(prompt, options?.systemPrompt);
    const modelToUse = options?.model || this.model;

    const response = await this.makeRequest<OpenAIChatResponse>(
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
