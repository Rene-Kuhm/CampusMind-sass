import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  Optional,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import {
  LlmOptions,
  LlmResponse,
  LlmProviderType,
  ILlmProvider,
  LLM_PROVIDERS,
} from "../interfaces/rag.interface";
import { LlmProviderFactory } from "../providers";
import { ModelDiscoveryService } from "./model-discovery.service";

/**
 * Servicio de LLM con soporte multi-proveedor
 * Soporta: OpenAI, Google Gemini (FREE), DeepSeek, Groq (FREE)
 * Incluye modo híbrido: local RAG + conocimiento general
 * Usa auto-descubrimiento de modelos para siempre usar el mejor modelo FREE disponible
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly defaultProvider: ILlmProvider;
  private readonly providerType: LlmProviderType;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
    @Optional()
    @Inject(forwardRef(() => ModelDiscoveryService))
    private readonly modelDiscovery?: ModelDiscoveryService,
  ) {
    this.providerType = this.config.get<LlmProviderType>(
      "LLM_PROVIDER",
      "openai",
    );
    this.defaultProvider = LlmProviderFactory.createProvider(
      this.http,
      this.config,
      this.providerType,
    );

    this.logger.log(
      `LLM Service initialized with provider: ${this.providerType}`,
    );
    this.logAvailableProviders();
  }

  /**
   * Genera una respuesta del LLM usando el proveedor por defecto
   */
  async generateCompletion(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    return this.defaultProvider.generateCompletion(prompt, options);
  }

  /**
   * Genera texto usando el proveedor por defecto (alias para generateCompletion)
   * Retorna solo el contenido de texto
   */
  async generateText(
    prompt: string,
    options?: LlmOptions,
  ): Promise<string> {
    const response = await this.generateCompletion(prompt, options);
    return response.content;
  }

  /**
   * Genera una respuesta usando un proveedor específico
   */
  async generateWithProvider(
    prompt: string,
    providerType: LlmProviderType,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    const provider = LlmProviderFactory.createProvider(
      this.http,
      this.config,
      providerType,
    );
    return provider.generateCompletion(prompt, options);
  }

  /**
   * Genera respuesta usando el mejor proveedor gratuito disponible
   * Usa auto-descubrimiento para siempre seleccionar el modelo más reciente
   * Prioridad: Groq (Llama 3.3) -> Gemini (2.5 Flash) -> DeepSeek
   */
  async generateWithFreeProvider(
    prompt: string,
    options?: LlmOptions,
  ): Promise<LlmResponse> {
    // Intentar usar modelo descubierto automáticamente
    if (this.modelDiscovery) {
      const bestModel = this.modelDiscovery.getBestFreeModel();
      this.logger.debug(
        `Using auto-discovered best free model: ${bestModel.provider}/${bestModel.model}`,
      );

      const provider = LlmProviderFactory.createProvider(
        this.http,
        this.config,
        bestModel.provider,
        bestModel.model,
      );

      return provider.generateCompletion(prompt, options);
    }

    // Fallback al método tradicional si no hay auto-descubrimiento
    const freeProvider = LlmProviderFactory.getFirstFreeProvider(
      this.http,
      this.config,
    );

    if (!freeProvider) {
      this.logger.warn("No free provider available, falling back to default");
      return this.generateCompletion(prompt, options);
    }

    return freeProvider.generateCompletion(prompt, options);
  }

  /**
   * Genera respuesta con contexto RAG
   */
  async generateWithContext(
    query: string,
    context: string[],
    options?: {
      style?: "formal" | "practical" | "balanced";
      depth?: "basic" | "intermediate" | "advanced";
      language?: string;
      provider?: LlmProviderType;
      useFreeProvider?: boolean;
    },
  ): Promise<LlmResponse> {
    const systemPrompt = this.buildSystemPrompt(options);
    const contextText = context
      .map((c, i) => `[Fuente ${i + 1}]:\n${c}`)
      .join("\n\n---\n\n");

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

    const llmOptions: LlmOptions = {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.3,
    };

    // Seleccionar el método de generación según las opciones
    if (options?.useFreeProvider) {
      return this.generateWithFreeProvider(prompt, llmOptions);
    }

    if (options?.provider) {
      return this.generateWithProvider(prompt, options.provider, llmOptions);
    }

    return this.generateCompletion(prompt, llmOptions);
  }

  /**
   * Genera una respuesta general sin contexto RAG
   * Se usa cuando no hay recursos locales indexados
   */
  async generateGeneralAnswer(
    query: string,
    options?: {
      style?: "formal" | "practical" | "balanced";
      depth?: "basic" | "intermediate" | "advanced";
      language?: string;
      provider?: LlmProviderType;
      useFreeProvider?: boolean;
    },
  ): Promise<LlmResponse> {
    const systemPrompt = this.buildGeneralSystemPrompt(options);

    const prompt = `
PREGUNTA DEL ESTUDIANTE:
${query}

INSTRUCCIONES:
1. Responde de forma clara, estructurada y educativa
2. Usa ejemplos cuando sea apropiado
3. Si no estás seguro de algo, indícalo claramente
4. Mantén un tono académico pero accesible
5. Si la pregunta es sobre un tema muy específico o actualidad, sugiere buscar fuentes adicionales

RESPUESTA:`;

    const llmOptions: LlmOptions = {
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.5,
    };

    if (options?.useFreeProvider) {
      return this.generateWithFreeProvider(prompt, llmOptions);
    }

    if (options?.provider) {
      return this.generateWithProvider(prompt, options.provider, llmOptions);
    }

    return this.generateCompletion(prompt, llmOptions);
  }

  /**
   * Genera un resumen estilo Harvard
   */
  async generateHarvardSummary(
    content: string,
    options?: {
      depth?: "basic" | "intermediate" | "advanced";
      language?: string;
      provider?: LlmProviderType;
      useFreeProvider?: boolean;
    },
  ): Promise<LlmResponse> {
    const depth = options?.depth || "intermediate";
    const language = options?.language || "es";

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

    const llmOptions: LlmOptions = {
      maxTokens: 3000,
      temperature: 0.2,
    };

    if (options?.useFreeProvider) {
      return this.generateWithFreeProvider(prompt, llmOptions);
    }

    if (options?.provider) {
      return this.generateWithProvider(prompt, options.provider, llmOptions);
    }

    return this.generateCompletion(prompt, llmOptions);
  }

  /**
   * Obtiene información del proveedor actual
   */
  getCurrentProviderInfo() {
    return {
      type: this.providerType,
      ...LLM_PROVIDERS[this.providerType],
    };
  }

  /**
   * Obtiene el mejor modelo gratuito actualmente descubierto
   */
  getBestFreeModelInfo() {
    if (this.modelDiscovery) {
      const bestModel = this.modelDiscovery.getBestFreeModel();
      return {
        provider: bestModel.provider,
        model: bestModel.model,
        providerInfo: LLM_PROVIDERS[bestModel.provider],
        isAutoDiscovered: true,
      };
    }

    // Fallback to static config
    return {
      provider: "groq" as LlmProviderType,
      model: LLM_PROVIDERS.groq.defaultModel,
      providerInfo: LLM_PROVIDERS.groq,
      isAutoDiscovered: false,
    };
  }

  /**
   * Obtiene todos los modelos descubiertos por proveedor
   */
  getDiscoveredModels(provider: LlmProviderType) {
    if (this.modelDiscovery) {
      return this.modelDiscovery.getDiscoveredModels(provider);
    }
    return [];
  }

  /**
   * Fuerza re-descubrimiento de modelos
   */
  async refreshDiscoveredModels(): Promise<void> {
    if (this.modelDiscovery) {
      await this.modelDiscovery.refreshModels();
      this.logger.log("Model discovery refreshed");
    }
  }

  /**
   * Obtiene todos los proveedores configurados
   */
  getConfiguredProviders(): Array<{
    type: LlmProviderType;
    name: string;
    isFree: boolean;
    description: string;
  }> {
    const configured = LlmProviderFactory.getConfiguredProviders(this.config);
    return configured.map((type) => ({
      type,
      ...LLM_PROVIDERS[type],
    }));
  }

  /**
   * Verifica si un proveedor está disponible
   */
  isProviderAvailable(providerType: LlmProviderType): boolean {
    return LlmProviderFactory.isProviderConfigured(this.config, providerType);
  }

  private logAvailableProviders(): void {
    const configured = this.getConfiguredProviders();
    const freeProviders = configured.filter((p) => p.isFree);

    this.logger.log(
      `Available providers: ${configured.map((p) => p.type).join(", ")}`,
    );

    if (freeProviders.length > 0) {
      this.logger.log(
        `Free providers available: ${freeProviders.map((p) => p.type).join(", ")}`,
      );
    }
  }

  private buildGeneralSystemPrompt(options?: {
    style?: "formal" | "practical" | "balanced";
    depth?: "basic" | "intermediate" | "advanced";
    language?: string;
  }): string {
    const style = options?.style || "balanced";
    const depth = options?.depth || "intermediate";
    const language = options?.language || "es";

    const styleGuide = {
      formal:
        "Usa un tono académico formal, con terminología técnica precisa y estructura rigurosa.",
      practical:
        "Enfócate en aplicaciones prácticas, usa ejemplos concretos y lenguaje accesible.",
      balanced:
        "Combina rigor académico con claridad práctica, equilibrando teoría y aplicación.",
    };

    const depthGuide = {
      basic:
        "Explica los conceptos de forma introductoria, asumiendo poco conocimiento previo.",
      intermediate:
        "Asume conocimientos básicos y profundiza en detalles importantes.",
      advanced:
        "Profundiza en aspectos técnicos avanzados, asumiendo dominio del tema.",
    };

    return `Eres CampusMind, un copiloto académico inteligente que ayuda a estudiantes universitarios.

ESTILO: ${styleGuide[style]}
PROFUNDIDAD: ${depthGuide[depth]}
IDIOMA: Responde en ${language === "es" ? "español" : language}

CAPACIDADES:
- Puedes responder preguntas de cualquier área académica
- Tienes conocimiento general de ciencias, humanidades, ingeniería, medicina, derecho, etc.
- Puedes explicar conceptos, dar ejemplos y ayudar con problemas

PRINCIPIOS:
- Sé preciso y evita información incorrecta
- Si no sabes algo con certeza, admítelo
- Estructura tus respuestas de forma clara y organizada
- Adapta tu lenguaje al nivel del estudiante
- Para información muy actualizada o específica, sugiere verificar fuentes adicionales`;
  }

  private buildSystemPrompt(options?: {
    style?: "formal" | "practical" | "balanced";
    depth?: "basic" | "intermediate" | "advanced";
    language?: string;
  }): string {
    const style = options?.style || "balanced";
    const depth = options?.depth || "intermediate";
    const language = options?.language || "es";

    const styleGuide = {
      formal:
        "Usa un tono académico formal, con terminología técnica precisa y estructura rigurosa.",
      practical:
        "Enfócate en aplicaciones prácticas, usa ejemplos concretos y lenguaje accesible.",
      balanced:
        "Combina rigor académico con claridad práctica, equilibrando teoría y aplicación.",
    };

    const depthGuide = {
      basic:
        "Explica los conceptos de forma introductoria, asumiendo poco conocimiento previo.",
      intermediate:
        "Asume conocimientos básicos y profundiza en detalles importantes.",
      advanced:
        "Profundiza en aspectos técnicos avanzados, asumiendo dominio del tema.",
    };

    return `Eres CampusMind, un copiloto académico experto que ayuda a estudiantes universitarios.

ESTILO: ${styleGuide[style]}
PROFUNDIDAD: ${depthGuide[depth]}
IDIOMA: Responde en ${language === "es" ? "español" : language}

PRINCIPIOS:
- Siempre cita tus fuentes cuando uses información del contexto
- Sé preciso y evita información incorrecta
- Si no sabes algo o el contexto es insuficiente, admítelo
- Estructura tus respuestas de forma clara y organizada
- Adapta tu lenguaje al nivel del estudiante`;
  }
}
