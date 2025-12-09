import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CalendarSyncService } from './calendar-sync.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller('calendar-sync')
@UseGuards(JwtAuthGuard)
export class CalendarSyncController {
  constructor(private readonly calendarSyncService: CalendarSyncService) {}

  @Get('integrations')
  getIntegrations(@CurrentUser('id') userId: string) {
    return this.calendarSyncService.getIntegrations(userId);
  }

  @Get('google/auth-url')
  getGoogleAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.calendarSyncService.getGoogleAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.calendarSyncService.handleGoogleCallback(code, userId);
      // Redirect to settings page
      res.redirect('/app/settings/integrations?calendar=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?calendar=error');
    }
  }

  @Post('sync/:provider')
  syncCalendar(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE',
  ) {
    return this.calendarSyncService.syncCalendar(userId, provider);
  }

  @Patch(':integrationId')
  updateIntegration(
    @CurrentUser('id') userId: string,
    @Param('integrationId') integrationId: string,
    @Body() data: { syncEnabled?: boolean; syncDirection?: 'IMPORT' | 'EXPORT' | 'BOTH' },
  ) {
    return this.calendarSyncService.updateIntegration(userId, integrationId, data);
  }

  @Delete(':integrationId')
  deleteIntegration(
    @CurrentUser('id') userId: string,
    @Param('integrationId') integrationId: string,
  ) {
    return this.calendarSyncService.deleteIntegration(userId, integrationId);
  }

  @Get('export/ical')
  async exportIcal(@CurrentUser('id') userId: string, @Res() res: Response) {
    const icalContent = await this.calendarSyncService.exportToIcal(userId);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="campusmind-calendar.ics"');
    res.send(icalContent);
  }
}
