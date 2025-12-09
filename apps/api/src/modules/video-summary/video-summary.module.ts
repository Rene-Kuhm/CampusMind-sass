import { Module } from '@nestjs/common';
import { VideoSummaryController } from './video-summary.controller';
import { VideoSummaryService } from './video-summary.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VideoSummaryController],
  providers: [VideoSummaryService],
  exports: [VideoSummaryService],
})
export class VideoSummaryModule {}
