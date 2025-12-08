import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LlmProviderType, LLM_PROVIDERS } from '../interfaces/rag.interface';

export interface DiscoveredModel {
  id: string;
  provider: LlmProviderType;
  isAvailable: boolean;
  contextWindow?: number;
}

/**
 * Service that auto-discovers available models from each provider
 * and selects the best free model automatically
 */
@Injectable()
export class ModelDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(ModelDiscoveryService.name);
  private discoveredModels: Map<LlmProviderType, DiscoveredModel[]> = new Map();
  private bestFreeModel: { provider: LlmProviderType; model: string } | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  async onModuleInit() {
    // Discover models on startup
    await this.discoverAllModels();
  }

  /**
   * Discover available models from all configured providers
   */
  async discoverAllModels(): Promise<void> {
    this.logger.log('Starting model discovery...');

    const discoveries = await Promise.allSettled([
      this.discoverGroqModels(),
      this.discoverGeminiModels(),
    ]);

    // Log results
    for (const result of discoveries) {
      if (result.status === 'rejected') {
        this.logger.warn(`Model discovery failed: ${result.reason}`);
      }
    }

    // Select best free model
    this.selectBestFreeModel();

    this.logger.log(`Model discovery complete. Best free model: ${this.bestFreeModel?.provider}/${this.bestFreeModel?.model}`);
  }

  /**
   * Discover models from Groq API
   */
  private async discoverGroqModels(): Promise<void> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      this.logger.debug('Groq API key not configured, skipping discovery');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ data: Array<{ id: string; context_window?: number }> }>(
          'https://api.groq.com/openai/v1/models',
          {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 30000, // 30 seconds for slower connections
          }
        )
      );

      const models = response.data.data
        .filter(m => this.isGroqFreeModel(m.id))
        .map(m => ({
          id: m.id,
          provider: 'groq' as LlmProviderType,
          isAvailable: true,
          contextWindow: m.context_window,
        }));

      this.discoveredModels.set('groq', models);
      this.logger.log(`Groq: Discovered ${models.length} free models: ${models.map(m => m.id).join(', ')}`);
    } catch (error) {
      this.logger.warn(`Groq model discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Discover models from Gemini API
   */
  private async discoverGeminiModels(): Promise<void> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.debug('Gemini API key not configured, skipping discovery');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ models: Array<{ name: string; supportedGenerationMethods?: string[] }> }>(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          { timeout: 10000 }
        )
      );

      const models = response.data.models
        .filter(m => this.isGeminiFreeModel(m.name) && m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => ({
          id: m.name.replace('models/', ''),
          provider: 'gemini' as LlmProviderType,
          isAvailable: true,
        }));

      this.discoveredModels.set('gemini', models);
      this.logger.log(`Gemini: Discovered ${models.length} free models: ${models.map(m => m.id).join(', ')}`);
    } catch (error) {
      this.logger.warn(`Gemini model discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a Groq model is free tier
   */
  private isGroqFreeModel(modelId: string): boolean {
    // Groq free tier includes these model families
    const freePatterns = [
      'llama-3.3',
      'llama-3.1',
      'llama-3.2',
      'mixtral',
      'gemma',
      'whisper',
    ];
    return freePatterns.some(p => modelId.toLowerCase().includes(p));
  }

  /**
   * Check if a Gemini model is free tier
   */
  private isGeminiFreeModel(modelName: string): boolean {
    // Gemini free tier: Flash models (not Pro/Ultra)
    const name = modelName.toLowerCase();
    // Flash models are free, Pro/Ultra are paid
    if (name.includes('flash')) return true;
    // Exclude paid models
    if (name.includes('pro') || name.includes('ultra')) return false;
    // 1.5 models have free tier
    if (name.includes('1.5') || name.includes('2.0') || name.includes('2.5')) return true;
    return false;
  }

  /**
   * Select the best available free model based on priority
   */
  private selectBestFreeModel(): void {
    // Priority order: prefer latest Groq Llama, then Gemini 2.5 Flash
    const priorities: Array<{ provider: LlmProviderType; patterns: string[] }> = [
      { provider: 'groq', patterns: ['llama-3.3-70b', 'llama-3.3'] },
      { provider: 'gemini', patterns: ['gemini-2.5-flash', 'gemini-2.0-flash'] },
      { provider: 'groq', patterns: ['llama-3.1-70b', 'llama-3.1-8b'] },
      { provider: 'gemini', patterns: ['gemini-1.5-flash'] },
    ];

    for (const { provider, patterns } of priorities) {
      const providerModels = this.discoveredModels.get(provider);
      if (!providerModels) continue;

      for (const pattern of patterns) {
        const match = providerModels.find(m => m.id.includes(pattern));
        if (match) {
          this.bestFreeModel = { provider, model: match.id };
          return;
        }
      }
    }

    // Fallback to defaults if no models discovered
    this.bestFreeModel = { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  }

  /**
   * Get the best available free model
   */
  getBestFreeModel(): { provider: LlmProviderType; model: string } {
    return this.bestFreeModel || { provider: 'groq', model: LLM_PROVIDERS.groq.defaultModel };
  }

  /**
   * Get all discovered models for a provider
   */
  getDiscoveredModels(provider: LlmProviderType): DiscoveredModel[] {
    return this.discoveredModels.get(provider) || [];
  }

  /**
   * Check if a specific model is available
   */
  isModelAvailable(provider: LlmProviderType, modelId: string): boolean {
    const models = this.discoveredModels.get(provider);
    if (!models) return true; // Assume available if not discovered
    return models.some(m => m.id === modelId || m.id.includes(modelId));
  }

  /**
   * Get the best available model for a provider (with fallback)
   */
  getBestModelForProvider(provider: LlmProviderType): string {
    const models = this.discoveredModels.get(provider);
    if (!models || models.length === 0) {
      return LLM_PROVIDERS[provider].defaultModel;
    }

    // Return first available model (list is ordered by preference)
    const preferredOrder = LLM_PROVIDERS[provider].models;
    for (const preferred of preferredOrder) {
      if (models.some(m => m.id.includes(preferred))) {
        const found = models.find(m => m.id.includes(preferred));
        if (found) return found.id;
      }
    }

    return models[0].id;
  }

  /**
   * Force refresh model discovery
   */
  async refreshModels(): Promise<void> {
    this.discoveredModels.clear();
    await this.discoverAllModels();
  }
}
