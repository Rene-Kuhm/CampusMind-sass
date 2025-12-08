import { Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";
import {
  ILlmProvider,
  LlmOptions,
  LlmResponse,
  LlmProviderType,
} from "../interfaces/rag.interface";

/**
 * Base class for LLM providers with common functionality
 */
export abstract class BaseLlmProvider implements ILlmProvider {
  protected readonly logger: Logger;
  protected readonly apiKey: string;
  protected readonly model: string;
  protected readonly baseUrl: string;

  abstract readonly providerType: LlmProviderType;

  constructor(
    protected readonly http: HttpService,
    apiKey: string,
    model: string,
    baseUrl: string,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  abstract generateCompletion(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse>;

  /**
   * Helper to make HTTP requests with error handling
   */
  protected async makeRequest<T>(
    url: string,
    data: unknown,
    headers: Record<string, string>,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.http.post<T>(url, data, { headers }),
      );
      return response.data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Request failed: ${errorMessage}`);
      throw new Error(`${this.providerType} request failed: ${errorMessage}`);
    }
  }

  /**
   * Build messages array for chat completion
   */
  protected buildMessages(
    prompt: string,
    systemPrompt?: string,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    return messages;
  }
}
