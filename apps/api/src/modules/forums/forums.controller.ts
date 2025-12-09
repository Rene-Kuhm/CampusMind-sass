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
} from '@nestjs/common';
import { ForumsService } from './forums.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateThreadDto,
  UpdateThreadDto,
  CreateReplyDto,
  VoteDto,
  ThreadQueryDto,
  CreateCategoryDto,
} from './dto';

@Controller('forums')
@UseGuards(JwtAuthGuard)
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // Categories
  @Get('categories')
  getCategories() {
    return this.forumsService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.forumsService.createCategory(dto);
  }

  // Threads
  @Post('threads')
  createThread(@CurrentUser('id') userId: string, @Body() dto: CreateThreadDto) {
    return this.forumsService.createThread(userId, dto);
  }

  @Get('threads')
  getThreads(
    @CurrentUser('id') userId: string,
    @Query() query: ThreadQueryDto,
    @Query('page') page?: string,
  ) {
    return this.forumsService.getThreads(userId, query, page ? parseInt(page) : 1);
  }

  @Get('threads/:id')
  getThread(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.forumsService.getThread(userId, id);
  }

  @Patch('threads/:id')
  updateThread(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateThreadDto,
  ) {
    return this.forumsService.updateThread(userId, id, dto);
  }

  @Delete('threads/:id')
  deleteThread(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.forumsService.deleteThread(userId, id);
  }

  // Replies
  @Post('threads/:threadId/replies')
  createReply(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.forumsService.createReply(userId, threadId, dto);
  }

  @Post('replies/:replyId/accept')
  acceptReply(@CurrentUser('id') userId: string, @Param('replyId') replyId: string) {
    return this.forumsService.acceptReply(userId, replyId);
  }

  // Voting
  @Post('threads/:threadId/vote')
  voteThread(
    @CurrentUser('id') userId: string,
    @Param('threadId') threadId: string,
    @Body() dto: VoteDto,
  ) {
    return this.forumsService.voteThread(userId, threadId, dto.value);
  }

  @Post('replies/:replyId/vote')
  voteReply(
    @CurrentUser('id') userId: string,
    @Param('replyId') replyId: string,
    @Body() dto: VoteDto,
  ) {
    return this.forumsService.voteReply(userId, replyId, dto.value);
  }

  // Tags
  @Get('tags/popular')
  getPopularTags(@Query('limit') limit?: string) {
    return this.forumsService.getPopularTags(limit ? parseInt(limit) : 20);
  }
}
