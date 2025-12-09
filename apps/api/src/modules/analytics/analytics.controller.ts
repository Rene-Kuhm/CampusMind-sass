import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @Get('study-time')
  getStudyTimeChart(
    @CurrentUser('id') userId: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getStudyTimeChart(userId, days ? parseInt(days) : 30);
  }

  @Get('subject-distribution')
  getSubjectDistribution(@CurrentUser('id') userId: string) {
    return this.analyticsService.getSubjectDistribution(userId);
  }

  @Get('flashcards')
  getFlashcardStats(@CurrentUser('id') userId: string) {
    return this.analyticsService.getFlashcardStats(userId);
  }

  @Get('quizzes')
  getQuizStats(@CurrentUser('id') userId: string) {
    return this.analyticsService.getQuizStats(userId);
  }

  @Get('prediction')
  getProgressPrediction(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.analyticsService.getProgressPrediction(userId, subjectId);
  }
}
