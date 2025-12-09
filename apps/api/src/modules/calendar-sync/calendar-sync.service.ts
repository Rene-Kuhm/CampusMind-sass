import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

@Injectable()
export class CalendarSyncService {
  private readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // OAuth URL generation
  getGoogleAuthUrl(userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get('GOOGLE_CALENDAR_REDIRECT_URI');

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
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

  async handleGoogleCallback(code: string, userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get('GOOGLE_CALENDAR_REDIRECT_URI');

    // Exchange code for tokens
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Get primary calendar info
    const calendarResponse = await axios.get(
      `${this.GOOGLE_CALENDAR_API}/calendars/primary`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const calendarInfo = calendarResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Save or update integration
    await this.prisma.calendarIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'GOOGLE' },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        expiresAt,
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.summary,
        syncEnabled: true,
      },
      create: {
        userId,
        provider: 'GOOGLE',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        calendarId: calendarInfo.id,
        calendarName: calendarInfo.summary,
        syncDirection: 'BOTH',
      },
    });

    return { success: true, calendarName: calendarInfo.summary };
  }

  async getIntegrations(userId: string) {
    return this.prisma.calendarIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        calendarName: true,
        syncEnabled: true,
        syncDirection: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });
  }

  async syncCalendar(userId: string, provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE') {
    const integration = await this.prisma.calendarIntegration.findFirst({
      where: { userId, provider },
    });

    if (!integration) {
      throw new NotFoundException('Calendar integration not found');
    }

    // Refresh token if needed
    const accessToken = await this.ensureValidToken(integration);

    // Perform sync based on direction
    if (integration.syncDirection === 'IMPORT' || integration.syncDirection === 'BOTH') {
      await this.importEvents(userId, integration.id, accessToken, provider);
    }

    if (integration.syncDirection === 'EXPORT' || integration.syncDirection === 'BOTH') {
      await this.exportEvents(userId, integration.id, accessToken, provider);
    }

    // Update last sync time
    await this.prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, syncedAt: new Date() };
  }

  private async ensureValidToken(
    integration: { id: string; accessToken: string; refreshToken?: string | null; expiresAt?: Date | null },
  ): Promise<string> {
    if (integration.expiresAt && integration.expiresAt > new Date()) {
      return integration.accessToken;
    }

    if (!integration.refreshToken) {
      throw new BadRequestException('Token expired and no refresh token available');
    }

    // Refresh the token
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: integration.refreshToken,
      grant_type: 'refresh_token',
    });

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    await this.prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: { accessToken: access_token, expiresAt },
    });

    return access_token;
  }

  private async importEvents(
    userId: string,
    integrationId: string,
    accessToken: string,
    provider: string,
  ) {
    if (provider !== 'GOOGLE') return;

    // Get events from Google Calendar
    const now = new Date();
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const response = await axios.get(`${this.GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        timeMin: now.toISOString(),
        timeMax: threeMonthsLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      },
    });

    const googleEvents: GoogleCalendarEvent[] = response.data.items || [];

    for (const gEvent of googleEvents) {
      // Check if already mapped
      const existingMapping = await this.prisma.eventMapping.findFirst({
        where: { integrationId, externalEventId: gEvent.id },
      });

      const startTime = gEvent.start.dateTime || gEvent.start.date;
      const endTime = gEvent.end.dateTime || gEvent.end.date;
      const isAllDay = !gEvent.start.dateTime;

      if (existingMapping) {
        // Update existing local event
        await this.prisma.studyEvent.update({
          where: { id: existingMapping.localEventId },
          data: {
            title: gEvent.summary,
            description: gEvent.description,
            startTime: new Date(startTime!),
            endTime: new Date(endTime!),
            isAllDay,
          },
        });

        await this.prisma.eventMapping.update({
          where: { id: existingMapping.id },
          data: { lastSyncAt: new Date() },
        });
      } else {
        // Create new local event
        const newEvent = await this.prisma.studyEvent.create({
          data: {
            userId,
            title: gEvent.summary || 'Imported Event',
            description: gEvent.description,
            startTime: new Date(startTime!),
            endTime: new Date(endTime!),
            type: 'STUDY_SESSION',
            isAllDay,
          },
        });

        // Create mapping
        await this.prisma.eventMapping.create({
          data: {
            integrationId,
            localEventId: newEvent.id,
            externalEventId: gEvent.id,
            lastSyncAt: new Date(),
          },
        });
      }
    }
  }

  private async exportEvents(
    userId: string,
    integrationId: string,
    accessToken: string,
    provider: string,
  ) {
    if (provider !== 'GOOGLE') return;

    // Get local events not yet exported
    const localEvents = await this.prisma.studyEvent.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
    });

    for (const event of localEvents) {
      // Check if already mapped
      const existingMapping = await this.prisma.eventMapping.findFirst({
        where: { integrationId, localEventId: event.id },
      });

      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: event.isAllDay
          ? { date: event.startTime.toISOString().split('T')[0] }
          : { dateTime: event.startTime.toISOString() },
        end: event.isAllDay
          ? { date: event.endTime.toISOString().split('T')[0] }
          : { dateTime: event.endTime.toISOString() },
      };

      if (existingMapping) {
        // Update existing Google event
        await axios.put(
          `${this.GOOGLE_CALENDAR_API}/calendars/primary/events/${existingMapping.externalEventId}`,
          googleEvent,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        await this.prisma.eventMapping.update({
          where: { id: existingMapping.id },
          data: { lastSyncAt: new Date() },
        });
      } else {
        // Create new Google event
        const response = await axios.post(
          `${this.GOOGLE_CALENDAR_API}/calendars/primary/events`,
          googleEvent,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        // Create mapping
        await this.prisma.eventMapping.create({
          data: {
            integrationId,
            localEventId: event.id,
            externalEventId: response.data.id,
            lastSyncAt: new Date(),
          },
        });
      }
    }
  }

  async updateIntegration(
    userId: string,
    integrationId: string,
    data: { syncEnabled?: boolean; syncDirection?: 'IMPORT' | 'EXPORT' | 'BOTH' },
  ) {
    const integration = await this.prisma.calendarIntegration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return this.prisma.calendarIntegration.update({
      where: { id: integrationId },
      data,
    });
  }

  async deleteIntegration(userId: string, integrationId: string) {
    const integration = await this.prisma.calendarIntegration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    // Delete mappings first
    await this.prisma.eventMapping.deleteMany({
      where: { integrationId },
    });

    await this.prisma.calendarIntegration.delete({
      where: { id: integrationId },
    });

    return { success: true };
  }

  // Export events as iCal format
  async exportToIcal(userId: string) {
    const events = await this.prisma.studyEvent.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });

    const icalLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CampusMind//Calendar//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const event of events) {
      const formatDate = (date: Date) =>
        date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

      icalLines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@campusmind.app`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(event.startTime)}`,
        `DTEND:${formatDate(event.endTime)}`,
        `SUMMARY:${event.title}`,
        event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
        'END:VEVENT',
      );
    }

    icalLines.push('END:VCALENDAR');

    return icalLines.filter(Boolean).join('\r\n');
  }
}
