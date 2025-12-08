import { HttpService } from "@nestjs/axios";
import { BaseLlmProvider } from "./base.provider";
import {
  LlmOptions,
  LlmResponse,
  LlmProviderType,
} from "../interfaces/rag.interface";

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Google Gemini Provider (FREE tier available!)
 * - gemini-1.5-flash: Fast, free tier
 * - gemini-1.5-pro: More capable
 * - gemini-2.0-flash-exp: Experimental, fast
 *
 * Free limits: 15 RPM, 1M tokens/day
 */
export class GeminiProvider extends BaseLlmProvider {
  readonly providerType: LlmProviderType = "gemini";

  constructor(http: HttpService, apiKey: string, model: string) {
    super(
      http,
      apiKey,
      model,
      "https://generativelanguage.googleapis.com/v1beta",
    );
  }

  async generateCompletion(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    const modelToUse = options?.model || this.model;

    // Gemini uses a different format - combine system prompt into user prompt
    let fullPrompt = prompt;
    if (options?.systemPrompt) {
      fullPrompt = `${options.systemPrompt}\n\n---\n\n${prompt}`;
    }

    const response = await this.makeRequest<GeminiResponse>(
      `${this.baseUrl}/models/${modelToUse}:generateContent?key=${this.apiKey}`,
      {
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 1000,
        },
      },
      {
        "Content-Type": "application/json",
      },
    );

    const content = response.candidates[0]?.content?.parts[0]?.text || "";
    const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

    return {
      content,
      tokensUsed,
      finishReason: response.candidates[0]?.finishReason || "stop",
      provider: this.providerType,
      model: modelToUse,
    };
  }
}
