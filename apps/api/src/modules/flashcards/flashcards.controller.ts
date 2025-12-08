import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { FlashcardsService } from "./flashcards.service";
import {
  CreateFlashcardDto,
  UpdateFlashcardDto,
  CreateDeckDto,
  UpdateDeckDto,
  ReviewFlashcardDto,
} from "./dto/flashcard.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("flashcards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("flashcards")
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  // ==================== DECK ENDPOINTS ====================

  @Post("decks")
  @ApiOperation({ summary: "Crear nuevo deck de flashcards" })
  @ApiResponse({ status: 201, description: "Deck creado" })
  createDeck(@CurrentUser() user: User, @Body() dto: CreateDeckDto) {
    return this.flashcardsService.createDeck(user.id, dto);
  }

  @Get("decks")
  @ApiOperation({ summary: "Listar decks del usuario" })
  @ApiQuery({ name: "subjectId", required: false })
  @ApiResponse({ status: 200, description: "Lista de decks" })
  getDecks(@CurrentUser() user: User, @Query("subjectId") subjectId?: string) {
    return this.flashcardsService.getDecks(user.id, subjectId);
  }

  @Get("decks/:id")
  @ApiOperation({ summary: "Obtener deck por ID" })
  @ApiResponse({ status: 200, description: "Deck encontrado" })
  @ApiResponse({ status: 404, description: "Deck no encontrado" })
  getDeck(@CurrentUser() user: User, @Param("id") id: string) {
    return this.flashcardsService.getDeck(id, user.id);
  }

  @Patch("decks/:id")
  @ApiOperation({ summary: "Actualizar deck" })
  @ApiResponse({ status: 200, description: "Deck actualizado" })
  updateDeck(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.flashcardsService.updateDeck(id, user.id, dto);
  }

  @Delete("decks/:id")
  @ApiOperation({ summary: "Eliminar deck" })
  @ApiResponse({ status: 200, description: "Deck eliminado" })
  deleteDeck(@CurrentUser() user: User, @Param("id") id: string) {
    return this.flashcardsService.deleteDeck(id, user.id);
  }

  @Get("decks/:id/progress")
  @ApiOperation({ summary: "Obtener progreso del deck" })
  @ApiResponse({ status: 200, description: "Progreso del deck" })
  getDeckProgress(@CurrentUser() user: User, @Param("id") id: string) {
    return this.flashcardsService.getDeckProgress(id, user.id);
  }

  // ==================== FLASHCARD ENDPOINTS ====================

  @Post("cards")
  @ApiOperation({ summary: "Crear flashcard" })
  @ApiResponse({ status: 201, description: "Flashcard creada" })
  createFlashcard(@CurrentUser() user: User, @Body() dto: CreateFlashcardDto) {
    return this.flashcardsService.createFlashcard(user.id, dto);
  }

  @Get("decks/:deckId/cards")
  @ApiOperation({ summary: "Listar flashcards de un deck" })
  @ApiResponse({ status: 200, description: "Lista de flashcards" })
  getFlashcards(@CurrentUser() user: User, @Param("deckId") deckId: string) {
    return this.flashcardsService.getFlashcards(deckId, user.id);
  }

  @Get("cards/:id")
  @ApiOperation({ summary: "Obtener flashcard por ID" })
  @ApiResponse({ status: 200, description: "Flashcard encontrada" })
  getFlashcard(@CurrentUser() user: User, @Param("id") id: string) {
    return this.flashcardsService.getFlashcard(id, user.id);
  }

  @Patch("cards/:id")
  @ApiOperation({ summary: "Actualizar flashcard" })
  @ApiResponse({ status: 200, description: "Flashcard actualizada" })
  updateFlashcard(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.updateFlashcard(id, user.id, dto);
  }

  @Delete("cards/:id")
  @ApiOperation({ summary: "Eliminar flashcard" })
  @ApiResponse({ status: 200, description: "Flashcard eliminada" })
  deleteFlashcard(@CurrentUser() user: User, @Param("id") id: string) {
    return this.flashcardsService.deleteFlashcard(id, user.id);
  }

  // ==================== STUDY/REVIEW ENDPOINTS ====================

  @Get("due")
  @ApiOperation({ summary: "Obtener flashcards pendientes de revisión" })
  @ApiQuery({ name: "deckId", required: false })
  @ApiResponse({ status: 200, description: "Flashcards para revisar" })
  getDueCards(@CurrentUser() user: User, @Query("deckId") deckId?: string) {
    return this.flashcardsService.getDueCards(user.id, deckId);
  }

  @Post("cards/:id/review")
  @ApiOperation({ summary: "Registrar revisión de flashcard (SM-2)" })
  @ApiResponse({ status: 200, description: "Revisión registrada" })
  reviewFlashcard(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: ReviewFlashcardDto,
  ) {
    return this.flashcardsService.reviewFlashcard(id, user.id, dto.quality);
  }

  @Get("stats")
  @ApiOperation({ summary: "Obtener estadísticas de estudio" })
  @ApiQuery({ name: "deckId", required: false })
  @ApiResponse({ status: 200, description: "Estadísticas de estudio" })
  getStats(@CurrentUser() user: User, @Query("deckId") deckId?: string) {
    return this.flashcardsService.getStudyStats(user.id, deckId);
  }
}
