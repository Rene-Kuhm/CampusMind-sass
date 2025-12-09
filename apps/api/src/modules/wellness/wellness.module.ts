import { Module } from '@nestjs/common';
import { WellnessController } from './wellness.controller';
import { WellnessService } from './wellness.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WellnessController],
  providers: [WellnessService],
  exports: [WellnessService],
})
export class WellnessModule {}
