import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async getIntegrations(userId: string) {
    return this.prisma.externalIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        accountName: true,
        accountEmail: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // Notion Integration
  getNotionAuthUrl(userId: string) {
    const clientId = this.config.get('NOTION_CLIENT_ID');
    const redirectUri = this.config.get('NOTION_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      owner: 'user',
      state: userId,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  async handleNotionCallback(code: string, userId: string) {
    const clientId = this.config.get('NOTION_CLIENT_ID');
    const clientSecret = this.config.get('NOTION_CLIENT_SECRET');
    const redirectUri = this.config.get('NOTION_REDIRECT_URI');

    const response = await axios.post(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      },
      {
        auth: { username: clientId, password: clientSecret },
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const data = response.data;

    return this.prisma.externalIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'NOTION' },
      },
      update: {
        accessToken: data.access_token,
        accountId: data.workspace_id,
        accountName: data.workspace_name,
        isActive: true,
      },
      create: {
        userId,
        provider: 'NOTION',
        accessToken: data.access_token,
        accountId: data.workspace_id,
        accountName: data.workspace_name,
      },
    });
  }

  async exportToNotion(userId: string, type: string, data: any) {
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { userId, provider: 'NOTION', isActive: true },
    });

    if (!integration) {
      throw new NotFoundException('Notion integration not found');
    }

    // Create page in Notion
    const response = await axios.post(
      'https://api.notion.com/v1/pages',
      {
        parent: { type: 'workspace', workspace: true },
        properties: {
          title: {
            title: [{ text: { content: data.title || 'CampusMind Export' } }],
          },
        },
        children: this.convertToNotionBlocks(data.content),
      },
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
          'Notion-Version': '2022-06-28',
        },
      },
    );

    return { success: true, notionPageId: response.data.id };
  }

  private convertToNotionBlocks(content: string): any[] {
    const lines = content.split('\n');
    const blocks: any[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }],
          },
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: line.slice(3) } }],
          },
        });
      } else if (line.startsWith('- ')) {
        blocks.push({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }],
          },
        });
      } else if (line.trim()) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line } }],
          },
        });
      }
    }

    return blocks;
  }

  // Google Drive Integration
  getGoogleDriveAuthUrl(userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get('GOOGLE_DRIVE_REDIRECT_URI');

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: userId,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleDriveCallback(code: string, userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get('GOOGLE_DRIVE_REDIRECT_URI');

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Get user info
    const userResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    return this.prisma.externalIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'GOOGLE_DRIVE' },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        expiresAt,
        accountEmail: userResponse.data.email,
        accountName: userResponse.data.name,
        isActive: true,
      },
      create: {
        userId,
        provider: 'GOOGLE_DRIVE',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        accountEmail: userResponse.data.email,
        accountName: userResponse.data.name,
      },
    });
  }

  async importFromDrive(userId: string, fileId: string) {
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { userId, provider: 'GOOGLE_DRIVE', isActive: true },
    });

    if (!integration) {
      throw new NotFoundException('Google Drive integration not found');
    }

    const accessToken = await this.ensureValidGoogleToken(integration);

    // Get file metadata
    const metaResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { fields: 'name,mimeType,size' },
      },
    );

    // Download file content
    const contentResponse = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { alt: 'media' },
        responseType: 'arraybuffer',
      },
    );

    return {
      fileName: metaResponse.data.name,
      mimeType: metaResponse.data.mimeType,
      size: metaResponse.data.size,
      content: contentResponse.data,
    };
  }

  // Discord Integration
  getDiscordAuthUrl(userId: string) {
    const clientId = this.config.get('DISCORD_CLIENT_ID');
    const redirectUri = this.config.get('DISCORD_REDIRECT_URI');

    const scopes = ['identify', 'webhook.incoming'].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: userId,
    });

    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async handleDiscordCallback(code: string, userId: string) {
    const clientId = this.config.get('DISCORD_CLIENT_ID');
    const clientSecret = this.config.get('DISCORD_CLIENT_SECRET');
    const redirectUri = this.config.get('DISCORD_REDIRECT_URI');

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    const { access_token, webhook } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    return this.prisma.externalIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'DISCORD' },
      },
      update: {
        accessToken: access_token,
        accountId: userResponse.data.id,
        accountName: userResponse.data.username,
        isActive: true,
        settings: webhook ? { webhookUrl: webhook.url } : undefined,
      },
      create: {
        userId,
        provider: 'DISCORD',
        accessToken: access_token,
        accountId: userResponse.data.id,
        accountName: userResponse.data.username,
        settings: webhook ? { webhookUrl: webhook.url } : undefined,
      },
    });
  }

  async sendDiscordNotification(userId: string, message: string) {
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { userId, provider: 'DISCORD', isActive: true },
    });

    if (!integration || !integration.settings) {
      return { success: false, reason: 'No Discord webhook configured' };
    }

    const webhookUrl = (integration.settings as any).webhookUrl;
    if (!webhookUrl) {
      return { success: false, reason: 'No webhook URL' };
    }

    await axios.post(webhookUrl, {
      content: message,
      username: 'CampusMind',
    });

    return { success: true };
  }

  // Spotify Integration (for study playlists)
  getSpotifyAuthUrl(userId: string) {
    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');

    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'playlist-read-private',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state: userId,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleSpotifyCallback(code: string, userId: string) {
    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get('SPOTIFY_CLIENT_SECRET');
    const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');

    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Get user info
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    return this.prisma.externalIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'SPOTIFY' },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        accountId: userResponse.data.id,
        accountName: userResponse.data.display_name,
        isActive: true,
      },
      create: {
        userId,
        provider: 'SPOTIFY',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        accountId: userResponse.data.id,
        accountName: userResponse.data.display_name,
      },
    });
  }

  async getStudyPlaylists(userId: string) {
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { userId, provider: 'SPOTIFY', isActive: true },
    });

    if (!integration) {
      throw new NotFoundException('Spotify integration not found');
    }

    const accessToken = await this.ensureValidSpotifyToken(integration);

    // Search for study/focus playlists
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: 'study focus concentration',
        type: 'playlist',
        limit: 20,
      },
    });

    return response.data.playlists.items.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.images?.[0]?.url,
      tracksCount: p.tracks?.total,
      uri: p.uri,
    }));
  }

  private async ensureValidGoogleToken(integration: any): Promise<string> {
    if (integration.expiresAt && integration.expiresAt > new Date()) {
      return integration.accessToken;
    }

    if (!integration.refreshToken) {
      throw new BadRequestException('Token expired');
    }

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: this.config.get('GOOGLE_CLIENT_ID'),
      client_secret: this.config.get('GOOGLE_CLIENT_SECRET'),
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    });

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.externalIntegration.update({
      where: { id: integration.id },
      data: { accessToken: access_token, expiresAt },
    });

    return access_token;
  }

  private async ensureValidSpotifyToken(integration: any): Promise<string> {
    if (integration.expiresAt && integration.expiresAt > new Date()) {
      return integration.accessToken;
    }

    if (!integration.refreshToken) {
      throw new BadRequestException('Token expired');
    }

    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get('SPOTIFY_CLIENT_SECRET');

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken,
      }),
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.externalIntegration.update({
      where: { id: integration.id },
      data: { accessToken: access_token, expiresAt },
    });

    return access_token;
  }

  async deleteIntegration(userId: string, integrationId: string) {
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.externalIntegration.delete({ where: { id: integrationId } });
    return { success: true };
  }
}
