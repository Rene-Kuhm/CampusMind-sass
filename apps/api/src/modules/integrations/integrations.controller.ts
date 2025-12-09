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
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  getIntegrations(@CurrentUser('id') userId: string) {
    return this.integrationsService.getIntegrations(userId);
  }

  @Delete(':id')
  deleteIntegration(
    @CurrentUser('id') userId: string,
    @Param('id') integrationId: string,
  ) {
    return this.integrationsService.deleteIntegration(userId, integrationId);
  }

  // Notion
  @Get('notion/auth-url')
  getNotionAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.integrationsService.getNotionAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('notion/callback')
  async handleNotionCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.handleNotionCallback(code, userId);
      res.redirect('/app/settings/integrations?notion=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?notion=error');
    }
  }

  @Post('notion/export')
  exportToNotion(
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; data: any },
  ) {
    return this.integrationsService.exportToNotion(userId, body.type, body.data);
  }

  // Google Drive
  @Get('google-drive/auth-url')
  getGoogleDriveAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.integrationsService.getGoogleDriveAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('google-drive/callback')
  async handleGoogleDriveCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.handleGoogleDriveCallback(code, userId);
      res.redirect('/app/settings/integrations?drive=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?drive=error');
    }
  }

  @Get('google-drive/import/:fileId')
  importFromDrive(
    @CurrentUser('id') userId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.integrationsService.importFromDrive(userId, fileId);
  }

  // Discord
  @Get('discord/auth-url')
  getDiscordAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.integrationsService.getDiscordAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('discord/callback')
  async handleDiscordCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.handleDiscordCallback(code, userId);
      res.redirect('/app/settings/integrations?discord=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?discord=error');
    }
  }

  @Post('discord/notify')
  sendDiscordNotification(
    @CurrentUser('id') userId: string,
    @Body('message') message: string,
  ) {
    return this.integrationsService.sendDiscordNotification(userId, message);
  }

  // Spotify
  @Get('spotify/auth-url')
  getSpotifyAuthUrl(@CurrentUser('id') userId: string) {
    const url = this.integrationsService.getSpotifyAuthUrl(userId);
    return { url };
  }

  @Public()
  @Get('spotify/callback')
  async handleSpotifyCallback(
    @Query('code') code: string,
    @Query('state') userId: string,
    @Res() res: Response,
  ) {
    try {
      await this.integrationsService.handleSpotifyCallback(code, userId);
      res.redirect('/app/settings/integrations?spotify=success');
    } catch (error) {
      res.redirect('/app/settings/integrations?spotify=error');
    }
  }

  @Get('spotify/playlists')
  getStudyPlaylists(@CurrentUser('id') userId: string) {
    return this.integrationsService.getStudyPlaylists(userId);
  }
}
