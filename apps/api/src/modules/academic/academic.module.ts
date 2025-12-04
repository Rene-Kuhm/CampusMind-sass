import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { OpenAlexProvider } from './providers/openalex.provider';
import { SemanticScholarProvider } from './providers/semantic-scholar.provider';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [AcademicController],
  providers: [AcademicService, OpenAlexProvider, SemanticScholarProvider],
  exports: [AcademicService],
})
export class AcademicModule {}
