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
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreatePostDto,
  CreateCommentDto,
  CreateChallengeDto,
  GroupQueryDto,
  GroupRole,
} from './dto';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: GroupQueryDto) {
    return this.groupsService.findAll(userId, query);
  }

  @Get('my')
  findMyGroups(@CurrentUser('id') userId: string) {
    return this.groupsService.findMyGroups(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groupsService.findOne(userId, id);
  }

  @Post('join/:code')
  joinByCode(@CurrentUser('id') userId: string, @Param('code') code: string) {
    return this.groupsService.joinByCode(userId, code);
  }

  @Post(':id/leave')
  leave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.groupsService.leave(userId, id);
  }

  @Patch(':id/members/:memberId/role')
  updateMemberRole(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
    @Body('role') role: GroupRole,
  ) {
    return this.groupsService.updateMemberRole(userId, groupId, memberId, role);
  }

  @Delete(':id/members/:memberId')
  kickMember(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupsService.kickMember(userId, groupId, memberId);
  }

  // Posts
  @Post(':id/posts')
  createPost(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.groupsService.createPost(userId, groupId, dto);
  }

  @Get(':id/posts')
  getPosts(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Query('page') page?: string,
  ) {
    return this.groupsService.getPosts(userId, groupId, page ? parseInt(page) : 1);
  }

  @Post('posts/:postId/like')
  toggleLike(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.groupsService.toggleLike(userId, postId);
  }

  @Post('posts/:postId/comments')
  addComment(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.groupsService.addComment(userId, postId, dto);
  }

  // Challenges
  @Post(':id/challenges')
  createChallenge(
    @CurrentUser('id') userId: string,
    @Param('id') groupId: string,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.groupsService.createChallenge(userId, groupId, dto);
  }

  @Post('challenges/:challengeId/join')
  joinChallenge(
    @CurrentUser('id') userId: string,
    @Param('challengeId') challengeId: string,
  ) {
    return this.groupsService.joinChallenge(userId, challengeId);
  }

  @Get('challenges/:challengeId/leaderboard')
  getChallengeLeaderboard(@Param('challengeId') challengeId: string) {
    return this.groupsService.getChallengeLeaderboard(challengeId);
  }
}
