import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import {
  ILlmProvider,
  LlmProviderType,
  LLM_PROVIDERS,
} from "../interfaces/rag.interface";
import { OpenAIProvider } from "./openai.provider";
import { GeminiProvider } from "./gemini.provider";
import { DeepSeekProvider } from "./deepseek.provider";
import { GroqProvider } from "./groq.provider";

/**
 * Factory for creating LLM providers
 * Supports dynamic model selection via modelOverride parameter
 */
export class LlmProviderFactory {
  private static readonly logger = new Logger("LlmProviderFactory");

  /**
   * Create a provider instance based on type
   * @param modelOverride - Optional model to use instead of default/config
   */
  static createProvider(
    http: HttpService,
    config: ConfigService,
    providerType?: LlmProviderType,
    modelOverride?: string,
  ): ILlmProvider {
    const type =
      providerType || config.get<LlmProviderType>("LLM_PROVIDER", "openai");

    switch (type) {
      case "openai":
        return this.createOpenAI(http, config, modelOverride);

      case "gemini":
        return this.createGemini(http, config, modelOverride);

      case "deepseek":
        return this.createDeepSeek(http, config, modelOverride);

      case "groq":
        return this.createGroq(http, config, modelOverride);

      default:
        this.logger.warn(`Unknown provider "${type}", falling back to OpenAI`);
        return this.createOpenAI(http, config, modelOverride);
    }
  }

  /**
   * Get the first available free provider
   */
  static getFirstFreeProvider(
    http: HttpService,
    config: ConfigService,
  ): ILlmProvider | null {
    // Try providers in order of preference
    const freeProviders: LlmProviderType[] = ["groq", "gemini", "deepseek"];

    for (const providerType of freeProviders) {
      const apiKey = this.getApiKeyForProvider(config, providerType);
      if (apiKey) {
        this.logger.log(`Using free provider: ${providerType}`);
        return this.createProvider(http, config, providerType);
      }
    }

    return null;
  }

  /**
   * Check if a provider is configured (has API key)
   */
  static isProviderConfigured(
    config: ConfigService,
    providerType: LlmProviderType,
  ): boolean {
    return !!this.getApiKeyForProvider(config, providerType);
  }

  /**
   * Get all configured providers
   */
  static getConfiguredProviders(config: ConfigService): LlmProviderType[] {
    const providers: LlmProviderType[] = [
      "openai",
      "gemini",
      "deepseek",
      "groq",
    ];
    return providers.filter((p) => this.isProviderConfigured(config, p));
  }

  private static getApiKeyForProvider(
    config: ConfigService,
    providerType: LlmProviderType,
  ): string | undefined {
    switch (providerType) {
      case "openai":
        return config.get<string>("OPENAI_API_KEY");
      case "gemini":
        return config.get<string>("GEMINI_API_KEY");
      case "deepseek":
        return config.get<string>("DEEPSEEK_API_KEY");
      case "groq":
        return config.get<string>("GROQ_API_KEY");
      default:
        return undefined;
    }
  }

  private static createOpenAI(
    http: HttpService,
    config: ConfigService,
    modelOverride?: string,
  ): OpenAIProvider {
    const apiKey = config.get<string>("OPENAI_API_KEY", "");
    const model =
      modelOverride ||
      config.get<string>("OPENAI_MODEL", LLM_PROVIDERS.openai.defaultModel);
    return new OpenAIProvider(http, apiKey, model);
  }

  private static createGemini(
    http: HttpService,
    config: ConfigService,
    modelOverride?: string,
  ): GeminiProvider {
    const apiKey = config.get<string>("GEMINI_API_KEY", "");
    const model =
      modelOverride ||
      config.get<string>("GEMINI_MODEL", LLM_PROVIDERS.gemini.defaultModel);
    return new GeminiProvider(http, apiKey, model);
  }

  private static createDeepSeek(
    http: HttpService,
    config: ConfigService,
    modelOverride?: string,
  ): DeepSeekProvider {
    const apiKey = config.get<string>("DEEPSEEK_API_KEY", "");
    const model =
      modelOverride ||
      config.get<string>("DEEPSEEK_MODEL", LLM_PROVIDERS.deepseek.defaultModel);
    return new DeepSeekProvider(http, apiKey, model);
  }

  private static createGroq(
    http: HttpService,
    config: ConfigService,
    modelOverride?: string,
  ): GroqProvider {
    const apiKey = config.get<string>("GROQ_API_KEY", "");
    const model =
      modelOverride ||
      config.get<string>("GROQ_MODEL", LLM_PROVIDERS.groq.defaultModel);
    return new GroqProvider(http, apiKey, model);
  }
}
