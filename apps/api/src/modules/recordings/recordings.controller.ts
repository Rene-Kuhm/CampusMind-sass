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
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  ParseArrayPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { RecordingsService } from './recordings.service';
import {
  CreateRecordingDto,
  UpdateRecordingDto,
  CreateBookmarkDto,
  CreateRecordingNoteDto,
} from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

// Local User interface to avoid Prisma dependency
interface User {
  id: string;
  email: string;
}

@ApiTags('recordings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  // ==================== RECORDING CRUD ====================

  @Post('upload')
  @ApiOperation({ summary: 'Upload/register a new audio recording' })
  @ApiResponse({ status: 201, description: 'Recording created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@CurrentUser() user: User, @Body() dto: CreateRecordingDto) {
    return this.recordingsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all recordings for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'isFavorite', required: false, type: Boolean })
  @ApiQuery({ name: 'isProcessed', required: false, type: Boolean })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Comma-separated list of tags',
  })
  @ApiResponse({ status: 200, description: 'List of recordings with pagination' })
  findAll(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('isFavorite') isFavorite?: string,
    @Query('isProcessed') isProcessed?: string,
    @Query('tags') tags?: string,
  ) {
    const filters = {
      ...(isFavorite !== undefined && { isFavorite: isFavorite === 'true' }),
      ...(isProcessed !== undefined && { isProcessed: isProcessed === 'true' }),
      ...(tags && { tags: tags.split(',').map((t) => t.trim()) }),
    };

    return this.recordingsService.findAll(user.id, filters, { page, limit });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get recording statistics for the current user' })
  @ApiResponse({ status: 200, description: 'Recording statistics' })
  getStatistics(@CurrentUser() user: User) {
    return this.recordingsService.getStatistics(user.id);
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get recordings by subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'List of recordings for the subject' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  findBySubject(
    @CurrentUser() user: User,
    @Param('subjectId') subjectId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.recordingsService.findBySubject(subjectId, user.id, {
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recording by ID' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording details with bookmarks and notes' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.recordingsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording updated successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateRecordingDto,
  ) {
    return this.recordingsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Recording deleted successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.recordingsService.delete(id, user.id);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite status' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'Favorite status toggled' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  toggleFavorite(@CurrentUser() user: User, @Param('id') id: string) {
    return this.recordingsService.toggleFavorite(id, user.id);
  }

  // ==================== BOOKMARKS ====================

  @Post(':id/bookmarks')
  @ApiOperation({ summary: 'Add bookmark to recording at specific timestamp' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 201, description: 'Bookmark created successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  @ApiResponse({
    status: 403,
    description: 'Timestamp exceeds recording duration',
  })
  addBookmark(
    @CurrentUser() user: User,
    @Param('id') recordingId: string,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.recordingsService.addBookmark(recordingId, user.id, dto);
  }

  @Get(':id/bookmarks')
  @ApiOperation({ summary: 'Get all bookmarks for a recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'List of bookmarks ordered by timestamp' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  getBookmarks(@CurrentUser() user: User, @Param('id') recordingId: string) {
    return this.recordingsService.getBookmarks(recordingId, user.id);
  }

  @Delete('bookmarks/:bookmarkId')
  @ApiOperation({ summary: 'Delete a bookmark' })
  @ApiParam({ name: 'bookmarkId', description: 'Bookmark ID' })
  @ApiResponse({ status: 200, description: 'Bookmark deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  deleteBookmark(
    @CurrentUser() user: User,
    @Param('bookmarkId') bookmarkId: string,
  ) {
    return this.recordingsService.deleteBookmark(bookmarkId, user.id);
  }

  // ==================== NOTES ====================

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add note to recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  @ApiResponse({
    status: 403,
    description: 'Timestamp exceeds recording duration',
  })
  addNote(
    @CurrentUser() user: User,
    @Param('id') recordingId: string,
    @Body() dto: CreateRecordingNoteDto,
  ) {
    return this.recordingsService.addNote(recordingId, user.id, dto);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes for a recording' })
  @ApiParam({ name: 'id', description: 'Recording ID' })
  @ApiResponse({ status: 200, description: 'List of notes' })
  @ApiResponse({ status: 404, description: 'Recording not found' })
  getNotes(@CurrentUser() user: User, @Param('id') recordingId: string) {
    return this.recordingsService.getNotes(recordingId, user.id);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update a note' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  updateNote(
    @CurrentUser() user: User,
    @Param('noteId') noteId: string,
    @Body('content') content: string,
  ) {
    return this.recordingsService.updateNote(noteId, user.id, content);
  }

  @Delete('notes/:noteId')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({ name: 'noteId', description: 'Note ID' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  deleteNote(@CurrentUser() user: User, @Param('noteId') noteId: string) {
    return this.recordingsService.deleteNote(noteId, user.id);
  }
}
