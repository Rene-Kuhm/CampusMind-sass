import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WellnessService } from './wellness.service';
import {
  CreateWellnessLogDto,
  UpdateWellnessLogDto,
  UpdateBreakReminderDto,
  WellnessQueryDto,
  WellnessStatsQueryDto,
} from './dto';
import { WellnessCategory } from '@prisma/client';

@ApiTags('Wellness')
@ApiBearerAuth()
@Controller('wellness')
@UseGuards(JwtAuthGuard)
export class WellnessController {
  constructor(private readonly wellnessService: WellnessService) {}

  // ============================================
  // WELLNESS LOGS CRUD
  // ============================================

  @Post('log')
  @ApiOperation({
    summary: 'Log daily wellness data',
    description: 'Create a new wellness log entry for tracking sleep, mood, stress, etc.',
  })
  @ApiResponse({ status: 201, description: 'Wellness log created successfully' })
  @ApiResponse({ status: 409, description: 'Log already exists for this date' })
  createLog(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWellnessLogDto,
  ) {
    return this.wellnessService.createLog(userId, dto);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get all wellness logs',
    description: 'Retrieve wellness logs with optional date filtering and pagination',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated wellness logs' })
  findAllLogs(
    @CurrentUser('id') userId: string,
    @Query() query: WellnessQueryDto,
  ) {
    return this.wellnessService.findAllLogs(userId, query);
  }

  @Get('logs/today')
  @ApiOperation({
    summary: "Get today's wellness log",
    description: "Retrieve the wellness log for today, or null if not logged yet",
  })
  @ApiResponse({ status: 200, description: "Returns today's log or null" })
  getTodayLog(@CurrentUser('id') userId: string) {
    return this.wellnessService.getTodayLog(userId);
  }

  @Post('logs/today')
  @ApiOperation({
    summary: 'Log or update today\'s wellness data',
    description: 'Creates a new log for today or updates existing one (upsert behavior)',
  })
  @ApiResponse({ status: 200, description: "Today's log created or updated" })
  logOrUpdateToday(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWellnessLogDto,
  ) {
    return this.wellnessService.logOrUpdateToday(userId, dto);
  }

  @Get('logs/date/:date')
  @ApiOperation({
    summary: 'Get wellness log by date',
    description: 'Retrieve the wellness log for a specific date',
  })
  @ApiParam({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
  })
  @ApiResponse({ status: 200, description: 'Returns the wellness log' })
  @ApiResponse({ status: 404, description: 'No log found for this date' })
  findLogByDate(
    @CurrentUser('id') userId: string,
    @Param('date') date: string,
  ) {
    return this.wellnessService.findLogByDate(userId, date);
  }

  @Get('logs/:id')
  @ApiOperation({
    summary: 'Get wellness log by ID',
    description: 'Retrieve a specific wellness log by its ID',
  })
  @ApiParam({ name: 'id', description: 'Wellness log ID' })
  @ApiResponse({ status: 200, description: 'Returns the wellness log' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  findLogById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.wellnessService.findLogById(userId, id);
  }

  @Patch('logs/:id')
  @ApiOperation({
    summary: 'Update wellness log',
    description: 'Update an existing wellness log entry',
  })
  @ApiParam({ name: 'id', description: 'Wellness log ID' })
  @ApiResponse({ status: 200, description: 'Log updated successfully' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  updateLog(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWellnessLogDto,
  ) {
    return this.wellnessService.updateLog(userId, id, dto);
  }

  @Delete('logs/:id')
  @ApiOperation({
    summary: 'Delete wellness log',
    description: 'Delete a wellness log entry',
  })
  @ApiParam({ name: 'id', description: 'Wellness log ID' })
  @ApiResponse({ status: 200, description: 'Log deleted successfully' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  deleteLog(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.wellnessService.deleteLog(userId, id);
  }

  // ============================================
  // BREAK REMINDERS
  // ============================================

  @Get('break-reminder')
  @ApiOperation({
    summary: 'Get break reminder settings',
    description: 'Retrieve the user\'s break reminder configuration',
  })
  @ApiResponse({ status: 200, description: 'Returns break reminder settings' })
  getBreakReminder(@CurrentUser('id') userId: string) {
    return this.wellnessService.getBreakReminder(userId);
  }

  @Patch('break-reminder')
  @ApiOperation({
    summary: 'Update break reminder settings',
    description: 'Configure break reminder intervals, times, and notification preferences',
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateBreakReminder(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBreakReminderDto,
  ) {
    return this.wellnessService.updateBreakReminder(userId, dto);
  }

  // ============================================
  // WELLNESS TIPS
  // ============================================

  @Get('tips')
  @ApiOperation({
    summary: 'Get wellness tips',
    description: 'Get personalized wellness tips based on user data and recent activity',
  })
  @ApiResponse({ status: 200, description: 'Returns relevant wellness tips' })
  getTips(@CurrentUser('id') userId: string) {
    return this.wellnessService.getTips(userId);
  }

  @Get('tips/category/:category')
  @ApiOperation({
    summary: 'Get wellness tips by category',
    description: 'Get all wellness tips for a specific category',
  })
  @ApiParam({
    name: 'category',
    description: 'Wellness category',
    enum: [
      'STRESS',
      'SLEEP',
      'EXERCISE',
      'MINDFULNESS',
      'NUTRITION',
      'SOCIAL',
      'STUDY_HABITS',
      'MOTIVATION',
    ],
  })
  @ApiResponse({ status: 200, description: 'Returns tips for the category' })
  getTipsByCategory(@Param('category') category: WellnessCategory) {
    return this.wellnessService.getTipsByCategory(category);
  }

  // ============================================
  // STATISTICS
  // ============================================

  @Get('stats')
  @ApiOperation({
    summary: 'Get wellness statistics',
    description: 'Get aggregated wellness statistics including averages, trends, and insights',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 30)',
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Returns wellness statistics' })
  getStats(
    @CurrentUser('id') userId: string,
    @Query() query: WellnessStatsQueryDto,
  ) {
    return this.wellnessService.getStats(userId, query);
  }

  // ============================================
  // STREAK
  // ============================================

  @Get('streak')
  @ApiOperation({
    summary: 'Get wellness tracking streak',
    description: 'Get current and longest streak of consecutive wellness log entries',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns streak information',
    schema: {
      type: 'object',
      properties: {
        currentStreak: { type: 'number', example: 7 },
        longestStreak: { type: 'number', example: 14 },
        lastLogDate: { type: 'string', example: '2024-01-15' },
        totalLogs: { type: 'number', example: 45 },
        isLoggedToday: { type: 'boolean', example: true },
      },
    },
  })
  getStreak(@CurrentUser('id') userId: string) {
    return this.wellnessService.getStreak(userId);
  }
}
