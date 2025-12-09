import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TutoringService } from './tutoring.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateTutorProfileDto,
  UpdateTutorProfileDto,
  BookSessionDto,
  UpdateSessionDto,
  CreateReviewDto,
  TutorQueryDto,
} from './dto';

@Controller('tutoring')
@UseGuards(JwtAuthGuard)
export class TutoringController {
  constructor(private readonly tutoringService: TutoringService) {}

  // Tutor Profiles
  @Post('profile')
  createProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTutorProfileDto,
  ) {
    return this.tutoringService.createTutorProfile(userId, dto);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTutorProfileDto,
  ) {
    return this.tutoringService.updateTutorProfile(userId, dto);
  }

  @Get('profile/me')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.tutoringService.getMyTutorProfile(userId);
  }

  @Get('tutors')
  searchTutors(@Query() query: TutorQueryDto, @Query('page') page?: string) {
    return this.tutoringService.searchTutors(query, page ? parseInt(page) : 1);
  }

  @Get('tutors/:id')
  getTutor(@Param('id') id: string) {
    return this.tutoringService.getTutorProfile(id);
  }

  @Get('subjects')
  getSubjects() {
    return this.tutoringService.getAvailableSubjects();
  }

  // Sessions
  @Post('sessions')
  bookSession(@CurrentUser('id') userId: string, @Body() dto: BookSessionDto) {
    return this.tutoringService.bookSession(userId, dto);
  }

  @Get('sessions/student')
  getSessionsAsStudent(@CurrentUser('id') userId: string) {
    return this.tutoringService.getMySessionsAsStudent(userId);
  }

  @Get('sessions/tutor')
  getSessionsAsTutor(@CurrentUser('id') userId: string) {
    return this.tutoringService.getMySessionsAsTutor(userId);
  }

  @Patch('sessions/:id')
  updateSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.tutoringService.updateSession(userId, sessionId, dto);
  }

  @Post('sessions/:id/confirm')
  confirmSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.tutoringService.updateSessionStatus(userId, sessionId, 'CONFIRMED');
  }

  @Post('sessions/:id/complete')
  completeSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
  ) {
    return this.tutoringService.updateSessionStatus(userId, sessionId, 'COMPLETED');
  }

  @Post('sessions/:id/cancel')
  cancelSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body('reason') reason?: string,
  ) {
    return this.tutoringService.updateSessionStatus(userId, sessionId, 'CANCELLED', reason);
  }

  // Reviews
  @Post('tutors/:id/reviews')
  createReview(
    @CurrentUser('id') userId: string,
    @Param('id') tutorId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.tutoringService.createReview(userId, tutorId, dto);
  }
}
