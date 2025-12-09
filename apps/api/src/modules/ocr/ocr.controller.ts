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
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { IsString, IsOptional, IsInt } from 'class-validator';

class ProcessImageDto {
  @IsString()
  title: string;

  @IsString()
  fileUrl: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;

  @IsInt()
  fileSize: number;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('process')
  processImage(@CurrentUser('id') userId: string, @Body() dto: ProcessImageDto) {
    return this.ocrService.processImage(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.ocrService.findAll(userId, subjectId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ocrService.findOne(userId, id);
  }

  @Post(':id/reprocess')
  reprocess(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ocrService.reprocess(userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.ocrService.delete(userId, id);
  }
}
