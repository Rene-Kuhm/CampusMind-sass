import { Module } from '@nestjs/common';
import { EmailReportsController } from './email-reports.controller';
import { EmailReportsService } from './email-reports.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmailReportsController],
  providers: [EmailReportsService],
  exports: [EmailReportsService],
})
export class EmailReportsModule {}
