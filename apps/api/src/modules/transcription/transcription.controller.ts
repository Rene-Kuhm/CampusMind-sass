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
import { TranscriptionService } from './transcription.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class CreateTranscriptionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsEnum(['UPLOAD', 'YOUTUBE', 'RECORDING', 'URL'])
  sourceType: 'UPLOAD' | 'YOUTUBE' | 'RECORDING' | 'URL';

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

@Controller('transcription')
@UseGuards(JwtAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTranscriptionDto) {
    return this.transcriptionService.createTranscription(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.transcriptionService.getTranscriptions(userId, subjectId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.transcriptionService.getTranscription(userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.transcriptionService.deleteTranscription(userId, id);
  }
}
