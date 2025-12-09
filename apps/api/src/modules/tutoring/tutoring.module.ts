import { Module } from '@nestjs/common';
import { TutoringController } from './tutoring.controller';
import { TutoringService } from './tutoring.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TutoringController],
  providers: [TutoringService],
  exports: [TutoringService],
})
export class TutoringModule {}
