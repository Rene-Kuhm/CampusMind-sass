import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller('lms')
@UseGuards(JwtAuthGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('integrations')
  getIntegrations(@CurrentUser('id') userId: string) {
    return this.lmsService.getIntegrations(userId);
  }

  @Delete('integrations/:id')
  deleteIntegration(
    @CurrentUser('id') userId: string,
    @Param('id') integrationId: string,
  ) {
    return this.lmsService.deleteIntegration(userId, integrationId);
  }

  // Moodle
  @Post('moodle/connect')
  connectMoodle(
    @CurrentUser('id') userId: string,
    @Body() body: { instanceUrl: string; token: string },
  ) {
    return this.lmsService.connectMoodle(userId, body.instanceUrl, body.token);
  }

  @Get('moodle/courses')
  getMoodleCourses(@CurrentUser('id') userId: string) {
    return this.lmsService.getMoodleCourses(userId);
  }

  @Post('moodle/sync/:courseId')
  syncMoodleCourse(
    @CurrentUser('id') userId: string,
    @Param('courseId') courseId: string,
    @Body('subjectId') subjectId?: string,
  ) {
    return this.lmsService.syncMoodleCourse(userId, courseId, subjectId);
  }

  // Google Classroom
  @Get('google-classroom/auth-url')
  getGoogleClassroomAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.lmsService.getGoogleClassroomAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('google-classroom/callback')
  async handleGoogleClassroomCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.lmsService.handleGoogleClassroomCallback(code, userId);
      res.redirect('/app/settings/integrations?lms=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?lms=error');
    }
  }

  @Get('google-classroom/courses')
  getGoogleClassroomCourses(@CurrentUser('id') userId: string) {
    return this.lmsService.getGoogleClassroomCourses(userId);
  }
}
