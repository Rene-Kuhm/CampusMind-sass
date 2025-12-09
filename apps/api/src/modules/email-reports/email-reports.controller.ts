import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EmailReportsService } from './email-reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('email-reports')
@UseGuards(JwtAuthGuard)
export class EmailReportsController {
  constructor(private readonly emailReportsService: EmailReportsService) {}

  @Get('config')
  getConfig(@CurrentUser('id') userId: string) {
    return this.emailReportsService.getOrCreateConfig(userId);
  }

  @Patch('config')
  updateConfig(
    @CurrentUser('id') userId: string,
    @Body()
    data: {
      isEnabled?: boolean;
      frequency?: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
      dayOfWeek?: number;
      dayOfMonth?: number;
      timeOfDay?: string;
      timezone?: string;
      includeStudyTime?: boolean;
      includeFlashcards?: boolean;
      includeQuizzes?: boolean;
      includeTasks?: boolean;
      includeGoals?: boolean;
      includeUpcoming?: boolean;
    },
  ) {
    return this.emailReportsService.updateConfig(userId, data);
  }

  @Get('preview')
  previewReport(@CurrentUser('id') userId: string) {
    return this.emailReportsService.previewReport(userId);
  }

  @Post('send')
  sendReport(@CurrentUser('id') userId: string) {
    return this.emailReportsService.sendReport(userId);
  }
}
