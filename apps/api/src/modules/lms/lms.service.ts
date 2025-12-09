import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable()
export class LmsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Moodle Integration
  async connectMoodle(
    userId: string,
    instanceUrl: string,
    token: string,
  ) {
    // Validate token by getting user info
    try {
      const response = await axios.get(
        `${instanceUrl}/webservice/rest/server.php`,
        {
          params: {
            wstoken: token,
            wsfunction: 'core_webservice_get_site_info',
            moodlewsrestformat: 'json',
          },
        },
      );

      const data = response.data;
      if (data.errorcode) {
        throw new BadRequestException(`Moodle error: ${data.message}`);
      }

      // Save integration
      const integration = await this.prisma.lmsIntegration.upsert({
        where: {
          userId_provider: { userId, provider: 'MOODLE' },
        },
        update: {
          instanceUrl,
          accessToken: token,
          lmsUserId: data.userid?.toString(),
          lmsUsername: data.username,
          isActive: true,
        },
        create: {
          userId,
          provider: 'MOODLE',
          instanceUrl,
          accessToken: token,
          lmsUserId: data.userid?.toString(),
          lmsUsername: data.username,
        },
      });

      return {
        success: true,
        integration,
        siteInfo: {
          sitename: data.sitename,
          username: data.username,
          fullname: data.fullname,
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException('Could not connect to Moodle instance');
      }
      throw error;
    }
  }

  async getMoodleCourses(userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { userId, provider: 'MOODLE', isActive: true },
    });

    if (!integration || !integration.instanceUrl) {
      throw new NotFoundException('Moodle integration not found');
    }

    const response = await axios.get(
      `${integration.instanceUrl}/webservice/rest/server.php`,
      {
        params: {
          wstoken: integration.accessToken,
          wsfunction: 'core_enrol_get_users_courses',
          moodlewsrestformat: 'json',
          userid: integration.lmsUserId,
        },
      },
    );

    if (response.data.errorcode) {
      throw new BadRequestException(response.data.message);
    }

    return response.data.map((course: any) => ({
      id: course.id,
      name: course.fullname,
      shortName: course.shortname,
      category: course.categoryname,
    }));
  }

  async syncMoodleCourse(userId: string, courseId: string, subjectId?: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { userId, provider: 'MOODLE', isActive: true },
      include: { courses: true },
    });

    if (!integration || !integration.instanceUrl) {
      throw new NotFoundException('Moodle integration not found');
    }

    // Get course info
    const courseResponse = await axios.get(
      `${integration.instanceUrl}/webservice/rest/server.php`,
      {
        params: {
          wstoken: integration.accessToken,
          wsfunction: 'core_course_get_courses',
          moodlewsrestformat: 'json',
          'options[ids][0]': courseId,
        },
      },
    );

    const courseInfo = courseResponse.data[0];
    if (!courseInfo) {
      throw new NotFoundException('Course not found in Moodle');
    }

    // Create or update LMS course mapping
    const lmsCourse = await this.prisma.lmsCourse.upsert({
      where: {
        integrationId_lmsCourseId: {
          integrationId: integration.id,
          lmsCourseId: courseId,
        },
      },
      update: {
        name: courseInfo.fullname,
        shortName: courseInfo.shortname,
        subjectId,
      },
      create: {
        integrationId: integration.id,
        lmsCourseId: courseId,
        name: courseInfo.fullname,
        shortName: courseInfo.shortname,
        subjectId,
      },
    });

    // Sync assignments as tasks
    await this.syncMoodleAssignments(integration, courseId, lmsCourse.subjectId);

    // Sync grades
    await this.syncMoodleGrades(integration, courseId, lmsCourse.subjectId);

    // Update sync time
    await this.prisma.lmsCourse.update({
      where: { id: lmsCourse.id },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, course: lmsCourse };
  }

  private async syncMoodleAssignments(
    integration: any,
    courseId: string,
    subjectId?: string | null,
  ) {
    const response = await axios.get(
      `${integration.instanceUrl}/webservice/rest/server.php`,
      {
        params: {
          wstoken: integration.accessToken,
          wsfunction: 'mod_assign_get_assignments',
          moodlewsrestformat: 'json',
          'courseids[0]': courseId,
        },
      },
    );

    const assignments = response.data.courses?.[0]?.assignments || [];

    for (const assign of assignments) {
      // Check if task already exists
      const existingTask = await this.prisma.task.findFirst({
        where: {
          userId: integration.userId,
          title: assign.name,
          subjectId,
        },
      });

      if (!existingTask) {
        await this.prisma.task.create({
          data: {
            userId: integration.userId,
            subjectId,
            title: assign.name,
            description: assign.intro ? this.stripHtml(assign.intro) : undefined,
            dueDate: assign.duedate ? new Date(assign.duedate * 1000) : undefined,
            priority: 'MEDIUM',
            tags: ['moodle', 'auto-sync'],
          },
        });
      }
    }
  }

  private async syncMoodleGrades(
    integration: any,
    courseId: string,
    subjectId?: string | null,
  ) {
    if (!subjectId) return;

    const response = await axios.get(
      `${integration.instanceUrl}/webservice/rest/server.php`,
      {
        params: {
          wstoken: integration.accessToken,
          wsfunction: 'gradereport_user_get_grade_items',
          moodlewsrestformat: 'json',
          courseid: courseId,
          userid: integration.lmsUserId,
        },
      },
    );

    const gradeItems = response.data.usergrades?.[0]?.gradeitems || [];

    for (const item of gradeItems) {
      if (item.graderaw !== null && item.graderaw !== undefined) {
        const existingGrade = await this.prisma.grade.findFirst({
          where: {
            subjectId,
            name: item.itemname || 'Grade',
          },
        });

        if (!existingGrade) {
          await this.prisma.grade.create({
            data: {
              subjectId,
              name: item.itemname || 'Grade',
              score: item.graderaw,
              maxScore: item.grademax || 100,
              notes: 'Imported from Moodle',
            },
          });
        }
      }
    }
  }

  // Google Classroom Integration
  getGoogleClassroomAuthUrl(userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.config.get('GOOGLE_CLASSROOM_REDIRECT_URI');

    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
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

  async handleGoogleClassroomCallback(code: string, userId: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.get('GOOGLE_CLASSROOM_REDIRECT_URI');

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
      'https://classroom.googleapis.com/v1/userProfiles/me',
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const integration = await this.prisma.lmsIntegration.upsert({
      where: {
        userId_provider: { userId, provider: 'GOOGLE_CLASSROOM' },
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token || undefined,
        expiresAt,
        lmsUserId: userResponse.data.id,
        lmsUsername: userResponse.data.name?.fullName,
        isActive: true,
      },
      create: {
        userId,
        provider: 'GOOGLE_CLASSROOM',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        lmsUserId: userResponse.data.id,
        lmsUsername: userResponse.data.name?.fullName,
      },
    });

    return { success: true, integration };
  }

  async getGoogleClassroomCourses(userId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { userId, provider: 'GOOGLE_CLASSROOM', isActive: true },
    });

    if (!integration) {
      throw new NotFoundException('Google Classroom integration not found');
    }

    const accessToken = await this.ensureValidGoogleToken(integration);

    const response = await axios.get(
      'https://classroom.googleapis.com/v1/courses',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { studentId: 'me', courseStates: 'ACTIVE' },
      },
    );

    return (response.data.courses || []).map((course: any) => ({
      id: course.id,
      name: course.name,
      section: course.section,
      room: course.room,
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

    await this.prisma.lmsIntegration.update({
      where: { id: integration.id },
      data: { accessToken: access_token, expiresAt },
    });

    return access_token;
  }

  async getIntegrations(userId: string) {
    return this.prisma.lmsIntegration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        instanceUrl: true,
        lmsUsername: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
        courses: {
          select: {
            id: true,
            name: true,
            shortName: true,
            subjectId: true,
            lastSyncAt: true,
          },
        },
      },
    });
  }

  async deleteIntegration(userId: string, integrationId: string) {
    const integration = await this.prisma.lmsIntegration.findFirst({
      where: { id: integrationId, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.lmsIntegration.delete({ where: { id: integrationId } });
    return { success: true };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
