import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { SocialService } from "./social.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import {
  // Professor Reviews
  CreateProfessorReviewDto,
  ProfessorReviewResponseDto,
  ProfessorReviewsListDto,
  // Study Buddy
  UpdateBuddyPreferencesDto,
  BuddyPreferencesResponseDto,
  BuddyMatchesListDto,
  UpdateMatchStatusDto,
  // Marketplace
  CreateMarketplaceListingDto,
  UpdateMarketplaceListingDto,
  MarketplaceListingResponseDto,
  MarketplaceListingsListDto,
  MarketplaceQueryDto,
  CreateMarketplaceMessageDto,
  MarketplaceMessagesListDto,
  ListingTypeEnum,
  ItemConditionEnum,
  // Shared Decks
  ShareDeckDto,
  SharedDeckResponseDto,
  SharedDecksListDto,
  SharedDecksQueryDto,
  RateDeckDto,
  DeckRatingsListDto,
} from "./dto";

interface User {
  id: string;
  email: string;
}

@ApiTags("social")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("social")
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ==================== PROFESSOR REVIEWS ====================

  @Post("professors/:id/review")
  @ApiOperation({ summary: "Create a review for a professor" })
  @ApiParam({ name: "id", description: "Professor ID" })
  @ApiResponse({
    status: 201,
    description: "Review created successfully",
    type: ProfessorReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: "Professor not found" })
  @ApiResponse({ status: 409, description: "Already reviewed this professor" })
  createProfessorReview(
    @CurrentUser() user: User,
    @Param("id") professorId: string,
    @Body() dto: CreateProfessorReviewDto
  ) {
    return this.socialService.createProfessorReview(user.id, professorId, dto);
  }

  @Get("professors/:id/reviews")
  @ApiOperation({ summary: "Get all reviews for a professor" })
  @ApiParam({ name: "id", description: "Professor ID" })
  @ApiResponse({
    status: 200,
    description: "List of reviews with aggregated stats",
    type: ProfessorReviewsListDto,
  })
  @ApiResponse({ status: 404, description: "Professor not found" })
  getProfessorReviews(@Param("id") professorId: string) {
    return this.socialService.getProfessorReviews(professorId);
  }

  // ==================== STUDY BUDDY MATCHING ====================

  @Post("buddies/preferences")
  @ApiOperation({ summary: "Update study buddy preferences" })
  @ApiResponse({
    status: 200,
    description: "Preferences updated successfully",
    type: BuddyPreferencesResponseDto,
  })
  updateBuddyPreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateBuddyPreferencesDto
  ) {
    return this.socialService.updateBuddyPreferences(user.id, dto);
  }

  @Get("buddies/preferences")
  @ApiOperation({ summary: "Get current user buddy preferences" })
  @ApiResponse({
    status: 200,
    description: "User preferences",
    type: BuddyPreferencesResponseDto,
  })
  getBuddyPreferences(@CurrentUser() user: User) {
    return this.socialService.getBuddyPreferences(user.id);
  }

  @Get("buddies/matches")
  @ApiOperation({ summary: "Find potential study buddy matches" })
  @ApiResponse({
    status: 200,
    description: "List of potential matches sorted by compatibility",
    type: BuddyMatchesListDto,
  })
  findBuddyMatches(@CurrentUser() user: User) {
    return this.socialService.findBuddyMatches(user.id);
  }

  @Post("buddies/matches/:userId")
  @ApiOperation({ summary: "Initiate a buddy match request" })
  @ApiParam({ name: "userId", description: "Target user ID to match with" })
  @ApiResponse({ status: 201, description: "Match request sent" })
  @ApiResponse({ status: 400, description: "Cannot match with yourself" })
  @ApiResponse({ status: 409, description: "Match already exists" })
  createBuddyMatch(
    @CurrentUser() user: User,
    @Param("userId") targetUserId: string
  ) {
    return this.socialService.createBuddyMatch(user.id, targetUserId);
  }

  @Patch("buddies/matches/:matchId")
  @ApiOperation({ summary: "Update match status (accept/reject)" })
  @ApiParam({ name: "matchId", description: "Match ID" })
  @ApiResponse({ status: 200, description: "Match status updated" })
  @ApiResponse({ status: 404, description: "Match not found" })
  updateMatchStatus(
    @CurrentUser() user: User,
    @Param("matchId") matchId: string,
    @Body() dto: UpdateMatchStatusDto
  ) {
    return this.socialService.updateMatchStatus(user.id, matchId, dto.status);
  }

  // ==================== MARKETPLACE ====================

  @Post("marketplace")
  @ApiOperation({ summary: "Create a marketplace listing" })
  @ApiResponse({
    status: 201,
    description: "Listing created successfully",
    type: MarketplaceListingResponseDto,
  })
  createListing(
    @CurrentUser() user: User,
    @Body() dto: CreateMarketplaceListingDto
  ) {
    return this.socialService.createListing(user.id, dto);
  }

  @Get("marketplace")
  @ApiOperation({ summary: "Get marketplace listings with filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "type", required: false, enum: ListingTypeEnum })
  @ApiQuery({ name: "category", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "minPrice", required: false, type: Number })
  @ApiQuery({ name: "maxPrice", required: false, type: Number })
  @ApiQuery({ name: "condition", required: false, enum: ItemConditionEnum })
  @ApiResponse({
    status: 200,
    description: "Paginated list of listings",
    type: MarketplaceListingsListDto,
  })
  getListings(@Query() query: MarketplaceQueryDto) {
    return this.socialService.getListings(query);
  }

  @Get("marketplace/my-listings")
  @ApiOperation({ summary: "Get current user listings" })
  @ApiResponse({
    status: 200,
    description: "User listings",
    type: MarketplaceListingsListDto,
  })
  getUserListings(@CurrentUser() user: User) {
    return this.socialService.getUserListings(user.id);
  }

  @Get("marketplace/:id")
  @ApiOperation({ summary: "Get a single marketplace listing" })
  @ApiParam({ name: "id", description: "Listing ID" })
  @ApiResponse({
    status: 200,
    description: "Listing details",
    type: MarketplaceListingResponseDto,
  })
  @ApiResponse({ status: 404, description: "Listing not found" })
  getListing(@Param("id") listingId: string) {
    return this.socialService.getListing(listingId);
  }

  @Put("marketplace/:id")
  @ApiOperation({ summary: "Update a marketplace listing" })
  @ApiParam({ name: "id", description: "Listing ID" })
  @ApiResponse({
    status: 200,
    description: "Listing updated successfully",
    type: MarketplaceListingResponseDto,
  })
  @ApiResponse({ status: 404, description: "Listing not found or no permission" })
  updateListing(
    @CurrentUser() user: User,
    @Param("id") listingId: string,
    @Body() dto: UpdateMarketplaceListingDto
  ) {
    return this.socialService.updateListing(user.id, listingId, dto);
  }

  @Delete("marketplace/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a marketplace listing" })
  @ApiParam({ name: "id", description: "Listing ID" })
  @ApiResponse({ status: 200, description: "Listing deleted successfully" })
  @ApiResponse({ status: 404, description: "Listing not found or no permission" })
  deleteListing(@CurrentUser() user: User, @Param("id") listingId: string) {
    return this.socialService.deleteListing(user.id, listingId);
  }

  @Post("marketplace/:id/message")
  @ApiOperation({ summary: "Send a message about a listing" })
  @ApiParam({ name: "id", description: "Listing ID" })
  @ApiResponse({ status: 201, description: "Message sent successfully" })
  @ApiResponse({ status: 404, description: "Listing not found" })
  @ApiResponse({ status: 400, description: "Cannot message yourself" })
  sendListingMessage(
    @CurrentUser() user: User,
    @Param("id") listingId: string,
    @Body() dto: CreateMarketplaceMessageDto
  ) {
    return this.socialService.sendListingMessage(user.id, listingId, dto);
  }

  @Get("marketplace/:id/messages")
  @ApiOperation({ summary: "Get messages for a listing" })
  @ApiParam({ name: "id", description: "Listing ID" })
  @ApiResponse({
    status: 200,
    description: "List of messages",
    type: MarketplaceMessagesListDto,
  })
  @ApiResponse({ status: 404, description: "Listing not found" })
  getListingMessages(
    @CurrentUser() user: User,
    @Param("id") listingId: string
  ) {
    return this.socialService.getListingMessages(user.id, listingId);
  }

  // ==================== SHARED FLASHCARD DECKS ====================

  @Post("decks/:id/share")
  @ApiOperation({ summary: "Share a flashcard deck with the community" })
  @ApiParam({ name: "id", description: "Deck ID to share" })
  @ApiResponse({
    status: 201,
    description: "Deck shared successfully",
    type: SharedDeckResponseDto,
  })
  @ApiResponse({ status: 404, description: "Deck not found or no permission" })
  @ApiResponse({ status: 409, description: "Deck already shared" })
  shareDeck(
    @CurrentUser() user: User,
    @Param("id") deckId: string,
    @Body() dto: ShareDeckDto
  ) {
    return this.socialService.shareDeck(user.id, deckId, dto);
  }

  @Get("shared-decks")
  @ApiOperation({ summary: "Get shared flashcard decks with filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "subject", required: false, type: String })
  @ApiQuery({ name: "university", required: false, type: String })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: ["rating", "downloads", "newest"],
  })
  @ApiResponse({
    status: 200,
    description: "Paginated list of shared decks",
    type: SharedDecksListDto,
  })
  getSharedDecks(@Query() query: SharedDecksQueryDto) {
    return this.socialService.getSharedDecks(query);
  }

  @Get("shared-decks/:id")
  @ApiOperation({ summary: "Get a single shared deck" })
  @ApiParam({ name: "id", description: "Shared deck ID" })
  @ApiResponse({
    status: 200,
    description: "Shared deck details",
    type: SharedDeckResponseDto,
  })
  @ApiResponse({ status: 404, description: "Shared deck not found" })
  getSharedDeck(@Param("id") sharedDeckId: string) {
    return this.socialService.getSharedDeck(sharedDeckId);
  }

  @Post("shared-decks/:id/rate")
  @ApiOperation({ summary: "Rate a shared flashcard deck" })
  @ApiParam({ name: "id", description: "Shared deck ID" })
  @ApiResponse({ status: 201, description: "Rating submitted successfully" })
  @ApiResponse({ status: 404, description: "Shared deck not found" })
  @ApiResponse({ status: 400, description: "Cannot rate your own deck" })
  rateDeck(
    @CurrentUser() user: User,
    @Param("id") sharedDeckId: string,
    @Body() dto: RateDeckDto
  ) {
    return this.socialService.rateDeck(user.id, sharedDeckId, dto);
  }

  @Get("shared-decks/:id/ratings")
  @ApiOperation({ summary: "Get ratings for a shared deck" })
  @ApiParam({ name: "id", description: "Shared deck ID" })
  @ApiResponse({
    status: 200,
    description: "List of ratings with distribution",
    type: DeckRatingsListDto,
  })
  @ApiResponse({ status: 404, description: "Shared deck not found" })
  getDeckRatings(@Param("id") sharedDeckId: string) {
    return this.socialService.getDeckRatings(sharedDeckId);
  }
}
