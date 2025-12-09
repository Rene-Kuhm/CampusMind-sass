import { Module } from '@nestjs/common';
import { CalendarSyncController } from './calendar-sync.controller';
import { CalendarSyncService } from './calendar-sync.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CalendarSyncController],
  providers: [CalendarSyncService],
  exports: [CalendarSyncService],
})
export class CalendarSyncModule {}
