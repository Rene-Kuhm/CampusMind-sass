import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VideoSummaryService } from './video-summary.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IsString, IsOptional } from 'class-validator';

class CreateVideoSummaryDto {
  @IsString()
  title: string;

  @IsString()
  videoUrl: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

@Controller('video-summary')
@UseGuards(JwtAuthGuard)
export class VideoSummaryController {
  constructor(private readonly videoSummaryService: VideoSummaryService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateVideoSummaryDto) {
    return this.videoSummaryService.createSummary(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.videoSummaryService.getSummaries(userId, subjectId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.videoSummaryService.getSummary(userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.videoSummaryService.deleteSummary(userId, id);
  }
}
