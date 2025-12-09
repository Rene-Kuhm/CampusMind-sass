import { Module } from '@nestjs/common';
import { StudyPlansController } from './study-plans.controller';
import { StudyPlansService } from './study-plans.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StudyPlansController],
  providers: [StudyPlansService],
  exports: [StudyPlansService],
})
export class StudyPlansModule {}
