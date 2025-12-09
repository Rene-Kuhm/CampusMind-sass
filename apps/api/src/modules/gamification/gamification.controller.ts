import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('gamification')
@UseGuards(JwtAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserProfile(userId);
  }

  @Get('achievements')
  getAllAchievements(@CurrentUser('id') userId: string) {
    return this.gamificationService.getAllAchievements(userId);
  }

  @Get('leaderboard')
  getLeaderboard(
    @Query('type') type?: 'xp' | 'points' | 'streak',
    @Query('limit') limit?: string,
  ) {
    return this.gamificationService.getLeaderboard(
      type || 'points',
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('rank')
  getUserRank(@CurrentUser('id') userId: string) {
    return this.gamificationService.getUserRank(userId);
  }

  @Post('streak/update')
  updateStreak(@CurrentUser('id') userId: string) {
    return this.gamificationService.updateStreak(userId);
  }

  @Post('check-achievements')
  checkAchievements(@CurrentUser('id') userId: string) {
    return this.gamificationService.checkAchievements(userId);
  }
}
