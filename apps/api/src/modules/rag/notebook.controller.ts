import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Res,
  Logger,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProduces,
} from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { TTSService } from "./services/tts.service";
import { QuestionGeneratorService } from "./services/question-generator.service";
import { PrismaService } from "@/database/prisma.service";
import {
  GenerateAudioDto,
  GeneratePodcastDto,
  GenerateQuestionsDto,
  GenerateFlashcardsDto,
  GenerateStudyGuideDto,
  GenerateQuestionsFromContentDto,
  GenerateFlashcardsFromContentDto,
  GenerateFromContentDto,
} from "./dto/notebook.dto";

@ApiTags("notebook")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notebook")
export class NotebookController {
  private readonly logger = new Logger(NotebookController.name);

  constructor(
    private readonly tts: TTSService,
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly prisma: PrismaService,
  ) {}

  // ==================== TTS ENDPOINTS ====================

  @Post("audio/generate")
  @ApiOperation({ summary: "Generar audio desde texto" })
  @ApiProduces("audio/mp3")
  @ApiResponse({ status: 200, description: "Audio generado exitosamente" })
  async generateAudio(@Body() dto: GenerateAudioDto, @Res() res: Response) {
    try {
      const result = await this.tts.generateAudio(dto.text, {
        voice: dto.voice,
        speed: dto.speed,
      });

      res.set({
        "Content-Type": result.mimeType,
        "Content-Disposition": 'attachment; filename="audio.mp3"',
        "Content-Length": result.audioData.length,
      });

      res.send(result.audioData);
    } catch (error) {
      this.logger.error(
        `Audio generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      throw new HttpException(
        "Error al generar el audio. Verifica que GEMINI_API_KEY esté configurada.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post("podcast/generate")
  @ApiOperation({ summary: "Generar podcast de estudio desde un recurso" })
  @ApiProduces("audio/mp3")
  @ApiResponse({ status: 200, description: "Podcast generado exitosamente" })
  async generatePodcast(
    @CurrentUser() user: User,
    @Body() dto: GeneratePodcastDto,
    @Res() res: Response,
  ) {
    // Get resource with chunks
    const resource = await this.prisma.resource.findFirst({
      where: {
        id: dto.resourceId,
        subject: { userId: user.id },
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          take: 20, // Limit chunks for TTS
        },
      },
    });

    if (!resource) {
      throw new HttpException("Recurso no encontrado", HttpStatus.NOT_FOUND);
    }

    const textContent = resource.chunks.map((c) => c.content).join("\n\n");
    if (!textContent) {
      throw new HttpException(
        "El recurso no tiene contenido de texto. Por favor, indexa el recurso primero.",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Generate podcast script first
      const script = await this.questionGenerator.generatePodcastScript(
        textContent,
        resource.title,
        { style: dto.style, duration: dto.duration },
      );

      // Convert to audio
      const result = await this.tts.generateAudio(script, {
        voice: dto.voice,
      });

      res.set({
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="podcast-${resource.title.replace(/[^a-zA-Z0-9]/g, "-")}.mp3"`,
        "Content-Length": result.audioData.length,
      });

      res.send(result.audioData);
    } catch (error) {
      this.logger.error(
        `Podcast generation failed: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      throw new HttpException(
        "Error al generar el podcast",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("voices")
  @ApiOperation({ summary: "Obtener voces disponibles para TTS" })
  @ApiResponse({ status: 200, description: "Lista de voces disponibles" })
  getAvailableVoices() {
    return this.tts.getAvailableVoices();
  }

  // ==================== QUESTION GENERATION ENDPOINTS ====================

  @Post("questions/generate")
  @ApiOperation({ summary: "Generar preguntas de estudio desde un recurso" })
  @ApiResponse({ status: 200, description: "Preguntas generadas exitosamente" })
  async generateQuestions(
    @CurrentUser() user: User,
    @Body() dto: GenerateQuestionsDto,
  ) {
    const resource = await this.getResourceContent(dto.resourceId, user.id);

    const questions = await this.questionGenerator.generateQuestions(
      resource.textContent,
      {
        count: dto.count,
        types: dto.types,
        difficulty: dto.difficulty,
      },
    );

    return {
      resourceId: dto.resourceId,
      resourceName: resource.title,
      questions,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post("questions/from-content")
  @ApiOperation({ summary: "Generar preguntas desde contenido de texto" })
  @ApiResponse({ status: 200, description: "Preguntas generadas exitosamente" })
  async generateQuestionsFromContent(
    @Body() dto: GenerateQuestionsFromContentDto,
  ) {
    const questions = await this.questionGenerator.generateQuestions(
      dto.content,
      {
        count: dto.count,
        types: dto.types,
        difficulty: dto.difficulty,
      },
    );

    return {
      title: dto.title || "Contenido sin título",
      questions,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== FLASHCARD GENERATION ENDPOINTS ====================

  @Post("flashcards/generate")
  @ApiOperation({ summary: "Generar flashcards desde un recurso" })
  @ApiResponse({
    status: 200,
    description: "Flashcards generadas exitosamente",
  })
  async generateFlashcards(
    @CurrentUser() user: User,
    @Body() dto: GenerateFlashcardsDto,
  ) {
    const resource = await this.getResourceContent(dto.resourceId, user.id);

    const flashcards = await this.questionGenerator.generateFlashcards(
      resource.textContent,
      {
        count: dto.count,
        includeFormulas: dto.includeFormulas,
      },
    );

    return {
      resourceId: dto.resourceId,
      resourceName: resource.title,
      flashcards,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post("flashcards/from-content")
  @ApiOperation({ summary: "Generar flashcards desde contenido de texto" })
  @ApiResponse({
    status: 200,
    description: "Flashcards generadas exitosamente",
  })
  async generateFlashcardsFromContent(
    @Body() dto: GenerateFlashcardsFromContentDto,
  ) {
    const flashcards = await this.questionGenerator.generateFlashcards(
      dto.content,
      { count: dto.count },
    );

    return {
      title: dto.title || "Contenido sin título",
      flashcards,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== STUDY GUIDE ENDPOINTS ====================

  @Post("study-guide/generate")
  @ApiOperation({ summary: "Generar guía de estudio desde un recurso" })
  @ApiResponse({ status: 200, description: "Guía de estudio generada" })
  async generateStudyGuide(
    @CurrentUser() user: User,
    @Body() dto: GenerateStudyGuideDto,
  ) {
    const resource = await this.getResourceContent(dto.resourceId, user.id);

    const guide = await this.questionGenerator.generateStudyGuide(
      resource.textContent,
      resource.title,
    );

    return {
      resourceId: dto.resourceId,
      resourceName: resource.title,
      ...guide,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post("study-guide/from-content")
  @ApiOperation({ summary: "Generar guía de estudio desde contenido de texto" })
  @ApiResponse({ status: 200, description: "Guía de estudio generada" })
  async generateStudyGuideFromContent(@Body() dto: GenerateFromContentDto) {
    const guide = await this.questionGenerator.generateStudyGuide(
      dto.content,
      dto.title || "Contenido sin título",
    );

    return {
      title: dto.title || "Contenido sin título",
      ...guide,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== PODCAST SCRIPT ENDPOINTS ====================

  @Post("podcast-script/generate")
  @ApiOperation({
    summary: "Generar script de podcast (texto) desde un recurso",
  })
  @ApiResponse({ status: 200, description: "Script generado exitosamente" })
  async generatePodcastScript(
    @CurrentUser() user: User,
    @Body() dto: GeneratePodcastDto,
  ) {
    const resource = await this.getResourceContent(dto.resourceId, user.id);

    const script = await this.questionGenerator.generatePodcastScript(
      resource.textContent,
      resource.title,
      { style: dto.style, duration: dto.duration },
    );

    return {
      resourceId: dto.resourceId,
      resourceName: resource.title,
      script,
      generatedAt: new Date().toISOString(),
    };
  }

  @Post("podcast-script/from-content")
  @ApiOperation({
    summary: "Generar script de podcast desde contenido de texto",
  })
  @ApiResponse({ status: 200, description: "Script generado exitosamente" })
  async generatePodcastScriptFromContent(
    @Body()
    dto: GenerateFromContentDto & {
      style?: "formal" | "casual";
      duration?: "short" | "medium" | "long";
    },
  ) {
    const script = await this.questionGenerator.generatePodcastScript(
      dto.content,
      dto.title || "Contenido sin título",
      { style: dto.style, duration: dto.duration },
    );

    return {
      title: dto.title || "Contenido sin título",
      script,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== FULL NOTEBOOK GENERATION ====================

  @Post("full/:resourceId")
  @ApiOperation({
    summary: "Generar notebook completo (guía + preguntas + flashcards)",
  })
  @ApiResponse({ status: 200, description: "Notebook completo generado" })
  async generateFullNotebook(
    @CurrentUser() user: User,
    @Param("resourceId") resourceId: string,
  ) {
    const resource = await this.getResourceContent(resourceId, user.id);
    const content = resource.textContent;
    const title = resource.title;

    // Generate all content in parallel
    const [studyGuide, questions, flashcards, podcastScript] =
      await Promise.all([
        this.questionGenerator.generateStudyGuide(content, title),
        this.questionGenerator.generateQuestions(content, {
          count: 10,
          difficulty: "mixed",
        }),
        this.questionGenerator.generateFlashcards(content, { count: 15 }),
        this.questionGenerator.generatePodcastScript(content, title, {
          duration: "medium",
        }),
      ]);

    return {
      resourceId,
      resourceName: title,
      studyGuide,
      questions,
      flashcards,
      podcastScript,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==================== HELPER METHODS ====================

  private async getResourceContent(resourceId: string, userId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: {
        id: resourceId,
        subject: { userId },
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          take: 50, // Limit chunks for processing
        },
      },
    });

    if (!resource) {
      throw new HttpException("Recurso no encontrado", HttpStatus.NOT_FOUND);
    }

    const textContent = resource.chunks.map((c) => c.content).join("\n\n");
    if (!textContent) {
      throw new HttpException(
        "El recurso no tiene contenido de texto. Por favor, indexa el recurso primero.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      ...resource,
      textContent,
    };
  }
}
