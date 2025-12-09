import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { ChunkingService } from "./services/chunking.service";
import { EmbeddingService } from "./services/embedding.service";
import { VectorStoreService } from "./services/vector-store.service";
import { LlmService } from "./services/llm.service";
import { CacheService } from "./services/cache.service";
import {
  RagQueryOptions,
  RagResponse,
  HarvardSummary,
} from "./interfaces/rag.interface";
import { UsageLimitsService } from "../billing/services/usage-limits.service";
import { UsageTypeEnum } from "../billing/constants/plans.constant";

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunking: ChunkingService,
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStoreService,
    private readonly llm: LlmService,
    private readonly cache: CacheService,
    private readonly usageLimitsService: UsageLimitsService,
  ) {}

  /**
   * Ingesta un recurso: chunking + embeddings + almacenamiento
   */
  async ingestResource(resourceId: string, userId: string): Promise<{
    chunksCreated: number;
    tokensUsed: number;
  }> {
    const startTime = Date.now();

    // Verificar límite de documentos a indexar
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.DOCUMENTS_INDEXED,
      "Has alcanzado el límite de documentos a indexar de tu plan. Mejora tu plan para indexar más.",
    );

    // Obtener el recurso
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      throw new NotFoundException("Recurso no encontrado");
    }

    // Por ahora, usamos la descripción/abstract como contenido
    // En el futuro, aquí se procesarían PDFs, videos, etc.
    const content = resource.description || "";

    if (!content || content.length < 50) {
      this.logger.warn(
        `Resource ${resourceId} has insufficient content for indexing`,
      );
      return { chunksCreated: 0, tokensUsed: 0 };
    }

    // Eliminar chunks anteriores si existen
    await this.vectorStore.deleteByResource(resourceId);

    // Dividir en chunks
    const chunks = this.chunking.chunkText(content, {
      resourceId,
      resourceTitle: resource.title,
    });

    this.logger.log(
      `Created ${chunks.length} chunks for resource ${resourceId}`,
    );

    // Generar embeddings en batch
    const embeddings = await this.embedding.generateEmbeddings(
      chunks.map((c) => c.content),
    );

    // Almacenar chunks con embeddings
    const chunkData = chunks.map((chunk, i) => ({
      resourceId,
      content: chunk.content,
      embedding: embeddings[i].embedding,
      metadata: chunk.metadata,
    }));

    await this.vectorStore.storeChunks(chunkData);

    // Actualizar estado del recurso
    await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        isIndexed: true,
        indexedAt: new Date(),
        chunkCount: chunks.length,
      },
    });

    // Invalidar cache RAG porque los chunks han cambiado
    this.cache.invalidateByResource(resourceId);

    const totalTokens = embeddings.reduce((sum, e) => sum + e.tokenCount, 0);

    // Incrementar uso de documentos indexados
    await this.usageLimitsService.incrementUsage(
      userId,
      UsageTypeEnum.DOCUMENTS_INDEXED,
    );

    this.logger.log(
      `Ingested resource ${resourceId} in ${Date.now() - startTime}ms`,
    );

    return {
      chunksCreated: chunks.length,
      tokensUsed: totalTokens,
    };
  }

  /**
   * Consulta RAG: busca contexto relevante y genera respuesta
   * Implementa cache para consultas frecuentes
   */
  async queryRAG(
    userId: string,
    query: string,
    options?: RagQueryOptions,
  ): Promise<RagResponse> {
    const startTime = Date.now();

    // Verificar cache primero (solo si no se especifica que se quiere respuesta fresca)
    if (!options?.skipCache) {
      const cached = this.cache.getRagResponse(query, {
        subjectId: options?.subjectId,
        resourceIds: options?.resourceIds,
      });

      if (cached) {
        this.logger.debug(
          `RAG cache hit for query: "${query.substring(0, 30)}..."`,
        );
        return {
          answer: cached.answer,
          citations: cached.citations,
          tokensUsed: 0, // No tokens used for cached response
          processingTimeMs: Date.now() - startTime,
          fromCache: true,
        };
      }
    }

    // Verificar límite de consultas RAG (solo para consultas no cacheadas)
    await this.usageLimitsService.enforceUsageLimit(
      userId,
      UsageTypeEnum.RAG_QUERIES,
      "Has alcanzado el límite de consultas IA de tu plan. Mejora tu plan para realizar más consultas.",
    );

    // Generar embedding de la consulta
    const queryEmbedding = await this.embedding.generateEmbedding(query);

    // Buscar chunks similares
    const similarChunks = await this.vectorStore.searchSimilar(
      queryEmbedding.embedding,
      {
        subjectId: options?.subjectId,
        resourceIds: options?.resourceIds,
        topK: options?.topK || 5,
        minScore: options?.minScore || 0.7,
      },
    );

    // Si no hay chunks locales, usar el LLM directamente (modo web/general)
    if (similarChunks.length === 0) {
      this.logger.log("No local resources found, using LLM general knowledge");

      const generalResponse = await this.llm.generateGeneralAnswer(query, {
        style: options?.style,
        depth: options?.depth,
        provider: options?.provider,
        useFreeProvider: options?.useFreeProvider,
      });

      // Guardar query en el log
      await this.prisma.ragQuery.create({
        data: {
          userId,
          subjectId: options?.subjectId,
          query,
          response: generalResponse.content,
          chunksUsed: [],
          tokensUsed: queryEmbedding.tokenCount + generalResponse.tokensUsed,
          responseTimeMs: Date.now() - startTime,
        },
      });

      // Incrementar uso de consultas RAG
      await this.usageLimitsService.incrementUsage(
        userId,
        UsageTypeEnum.RAG_QUERIES,
      );

      return {
        answer: generalResponse.content,
        citations: [],
        tokensUsed: queryEmbedding.tokenCount + generalResponse.tokensUsed,
        processingTimeMs: Date.now() - startTime,
        source: "general", // Indica que viene del conocimiento general del LLM
      };
    }

    // Preparar contexto para el LLM
    const contextTexts = similarChunks.map((chunk) => chunk.content);

    // Generar respuesta con LLM
    const llmResponse = await this.llm.generateWithContext(
      query,
      contextTexts,
      {
        style: options?.style,
        depth: options?.depth,
        provider: options?.provider,
        useFreeProvider: options?.useFreeProvider,
      },
    );

    // Construir citas
    const citations = similarChunks.map((chunk) => ({
      resourceId: chunk.metadata.resourceId,
      resourceTitle: chunk.metadata.resourceTitle,
      chunkContent:
        chunk.content.length > 200
          ? chunk.content.substring(0, 200) + "..."
          : chunk.content,
      page: chunk.metadata.page,
      section: chunk.metadata.section,
      relevanceScore: chunk.score,
    }));

    const totalTokens = queryEmbedding.tokenCount + llmResponse.tokensUsed;

    // Guardar en cache
    this.cache.setRagResponse(
      query,
      { answer: llmResponse.content, citations, tokensUsed: totalTokens },
      { subjectId: options?.subjectId, resourceIds: options?.resourceIds },
    );

    // Guardar query en el log
    await this.prisma.ragQuery.create({
      data: {
        userId,
        subjectId: options?.subjectId,
        query,
        response: llmResponse.content,
        chunksUsed: similarChunks.map((c) => ({ id: c.id, score: c.score })),
        tokensUsed: totalTokens,
        responseTimeMs: Date.now() - startTime,
      },
    });

    // Incrementar uso de consultas RAG
    await this.usageLimitsService.incrementUsage(
      userId,
      UsageTypeEnum.RAG_QUERIES,
    );

    return {
      answer: llmResponse.content,
      citations,
      tokensUsed: totalTokens,
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Genera un resumen estilo Harvard de un recurso
   */
  async generateSummary(
    resourceId: string,
    userId: string,
    options?: {
      depth?: "basic" | "intermediate" | "advanced";
    },
  ): Promise<HarvardSummary> {
    const resource = await this.prisma.resource.findFirst({
      where: { id: resourceId },
      include: {
        subject: true,
        chunks: {
          orderBy: { chunkIndex: "asc" },
          take: 10, // Limitar chunks para el resumen
        },
      },
    });

    if (!resource) {
      throw new NotFoundException("Recurso no encontrado");
    }

    // Verificar ownership a través de la materia
    if (resource.subject.userId !== userId) {
      throw new NotFoundException("Recurso no encontrado");
    }

    // Usar contenido de chunks o descripción
    let content =
      resource.chunks.length > 0
        ? resource.chunks.map((c) => c.content).join("\n\n")
        : resource.description || "";

    if (!content) {
      throw new Error("El recurso no tiene contenido para resumir");
    }

    // Limitar contenido para no exceder contexto del LLM
    if (content.length > 15000) {
      content = content.substring(0, 15000) + "...";
    }

    const response = await this.llm.generateHarvardSummary(content, {
      depth: options?.depth,
    });

    try {
      return JSON.parse(response.content) as HarvardSummary;
    } catch {
      this.logger.error("Failed to parse Harvard summary JSON");
      // Retornar estructura básica si falla el parsing
      return {
        theoreticalContext: response.content,
        keyIdeas: [],
        definitions: [],
        examples: [],
        commonMistakes: [],
        reviewChecklist: [],
        references: [],
      };
    }
  }

  /**
   * Genera flashcards a partir de un tema o contenido usando IA
   */
  async generateFlashcards(
    topic: string,
    options?: {
      count?: number;
      difficulty?: "basic" | "intermediate" | "advanced";
      language?: string;
      content?: string; // Contenido opcional para basar las flashcards
    },
  ): Promise<{
    flashcards: Array<{
      front: string;
      back: string;
    }>;
    tokensUsed: number;
  }> {
    const count = options?.count || 5;
    const difficulty = options?.difficulty || "intermediate";
    const language = options?.language || "es";

    const difficultyGuide = {
      basic:
        "Preguntas simples y directas, enfocadas en definiciones y conceptos fundamentales.",
      intermediate:
        "Preguntas que requieren comprensión y relación de conceptos.",
      advanced:
        "Preguntas que requieren análisis, síntesis y aplicación de conocimientos.",
    };

    const contentSection = options?.content
      ? `\n\nCONTENIDO DE REFERENCIA:\n${options.content.substring(0, 8000)}`
      : "";

    const prompt = `Genera exactamente ${count} flashcards educativas sobre el siguiente tema.${contentSection}

TEMA: ${topic}

NIVEL DE DIFICULTAD: ${difficultyGuide[difficulty]}
IDIOMA: ${language === "es" ? "Español" : language}

INSTRUCCIONES:
1. Cada flashcard debe tener una pregunta (front) y una respuesta (back)
2. Las preguntas deben ser claras y específicas
3. Las respuestas deben ser concisas pero completas
4. Varía el tipo de preguntas: definiciones, conceptos, aplicaciones, comparaciones
5. Asegúrate de que las respuestas sean correctas y educativas

FORMATO DE RESPUESTA (JSON válido):
{
  "flashcards": [
    {"front": "Pregunta 1", "back": "Respuesta 1"},
    {"front": "Pregunta 2", "back": "Respuesta 2"}
  ]
}

Responde SOLO con el JSON válido, sin texto adicional.`;

    const response = await this.llm.generateWithFreeProvider(prompt, {
      maxTokens: 2000,
      temperature: 0.7,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        flashcards: parsed.flashcards || [],
        tokensUsed: response.tokensUsed,
      };
    } catch {
      this.logger.error("Failed to parse flashcards JSON");
      return {
        flashcards: [],
        tokensUsed: response.tokensUsed,
      };
    }
  }

  /**
   * Genera un quiz/examen de práctica a partir de un tema usando IA
   */
  async generateQuiz(
    topic: string,
    options?: {
      questionCount?: number;
      difficulty?: "basic" | "intermediate" | "advanced";
      questionTypes?: ("multiple_choice" | "true_false" | "short_answer")[];
      language?: string;
      content?: string;
    },
  ): Promise<{
    questions: Array<{
      type: "multiple_choice" | "true_false" | "short_answer";
      question: string;
      options?: string[];
      correctAnswer: string;
      explanation?: string;
      points: number;
    }>;
    tokensUsed: number;
  }> {
    const count = options?.questionCount || 5;
    const difficulty = options?.difficulty || "intermediate";
    const language = options?.language || "es";
    const types = options?.questionTypes || [
      "multiple_choice",
      "true_false",
      "short_answer",
    ];

    const contentSection = options?.content
      ? `\n\nCONTENIDO DE REFERENCIA:\n${options.content.substring(0, 8000)}`
      : "";

    const prompt = `Genera exactamente ${count} preguntas de examen sobre el siguiente tema.${contentSection}

TEMA: ${topic}

NIVEL DE DIFICULTAD: ${difficulty}
IDIOMA: ${language === "es" ? "Español" : language}
TIPOS DE PREGUNTAS A INCLUIR: ${types.join(", ")}

INSTRUCCIONES:
1. Distribuye los tipos de preguntas de manera equilibrada
2. Para multiple_choice: incluye 4 opciones (A, B, C, D)
3. Para true_false: la respuesta debe ser "Verdadero" o "Falso"
4. Para short_answer: la respuesta debe ser breve (1-3 palabras o una frase corta)
5. Incluye una explicación breve para cada respuesta
6. Asigna puntos según dificultad (1-3)

FORMATO DE RESPUESTA (JSON válido):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "¿Cuál es...?",
      "options": ["A) Opción 1", "B) Opción 2", "C) Opción 3", "D) Opción 4"],
      "correctAnswer": "A",
      "explanation": "Explicación de por qué es correcta",
      "points": 2
    },
    {
      "type": "true_false",
      "question": "Afirmación verdadera o falsa",
      "correctAnswer": "Verdadero",
      "explanation": "Explicación",
      "points": 1
    },
    {
      "type": "short_answer",
      "question": "¿Qué es...?",
      "correctAnswer": "Respuesta corta",
      "explanation": "Explicación",
      "points": 2
    }
  ]
}

Responde SOLO con el JSON válido, sin texto adicional.`;

    const response = await this.llm.generateWithFreeProvider(prompt, {
      maxTokens: 3000,
      temperature: 0.7,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        questions: parsed.questions || [],
        tokensUsed: response.tokensUsed,
      };
    } catch {
      this.logger.error("Failed to parse quiz JSON");
      return {
        questions: [],
        tokensUsed: response.tokensUsed,
      };
    }
  }

  /**
   * Genera un resumen automático de contenido
   */
  async generateAutoSummary(
    content: string,
    options?: {
      style?: "bullet_points" | "paragraph" | "outline";
      length?: "short" | "medium" | "long";
      language?: string;
    },
  ): Promise<{
    summary: string;
    keyPoints: string[];
    tokensUsed: number;
  }> {
    const style = options?.style || "bullet_points";
    const length = options?.length || "medium";
    const language = options?.language || "es";

    const lengthGuide = {
      short: "3-5 puntos clave o 1-2 párrafos",
      medium: "5-8 puntos clave o 2-3 párrafos",
      long: "8-12 puntos clave o 4-5 párrafos",
    };

    const styleGuide = {
      bullet_points: "Usa viñetas para cada punto clave",
      paragraph: "Escribe en formato de párrafos fluidos",
      outline: "Usa formato de esquema con secciones y subsecciones",
    };

    const prompt = `Genera un resumen del siguiente contenido.

CONTENIDO:
${content.substring(0, 12000)}

ESTILO: ${styleGuide[style]}
LONGITUD: ${lengthGuide[length]}
IDIOMA: ${language === "es" ? "Español" : language}

INSTRUCCIONES:
1. Captura las ideas principales y conceptos clave
2. Mantén la precisión y evita añadir información no presente
3. Usa un lenguaje claro y académico
4. Organiza la información de manera lógica

FORMATO DE RESPUESTA (JSON válido):
{
  "summary": "El resumen completo aquí...",
  "keyPoints": [
    "Punto clave 1",
    "Punto clave 2",
    "Punto clave 3"
  ]
}

Responde SOLO con el JSON válido, sin texto adicional.`;

    const response = await this.llm.generateWithFreeProvider(prompt, {
      maxTokens: 2000,
      temperature: 0.3,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        summary: parsed.summary || "",
        keyPoints: parsed.keyPoints || [],
        tokensUsed: response.tokensUsed,
      };
    } catch {
      this.logger.error("Failed to parse summary JSON");
      return {
        summary: response.content,
        keyPoints: [],
        tokensUsed: response.tokensUsed,
      };
    }
  }

  /**
   * Obtiene estadísticas de uso RAG del usuario
   */
  async getUserStats(userId: string) {
    const [queryCount, totalTokens, recentQueries] = await Promise.all([
      this.prisma.ragQuery.count({ where: { userId } }),
      this.prisma.ragQuery.aggregate({
        where: { userId },
        _sum: { tokensUsed: true },
      }),
      this.prisma.ragQuery.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          query: true,
          createdAt: true,
          tokensUsed: true,
          subject: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      totalQueries: queryCount,
      totalTokensUsed: totalTokens._sum.tokensUsed || 0,
      recentQueries,
    };
  }
}
