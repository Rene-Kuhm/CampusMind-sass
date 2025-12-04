import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { OpenAlexProvider } from './providers/openalex.provider';
import { SemanticScholarProvider } from './providers/semantic-scholar.provider';
import { CrossrefProvider } from './providers/crossref.provider';

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000, // Increased for Crossref which can be slower
      maxRedirects: 3,
    }),
  ],
  controllers: [AcademicController],
  providers: [
    AcademicService,
    OpenAlexProvider,
    SemanticScholarProvider,
    CrossrefProvider,
  ],
  exports: [AcademicService],
})
export class AcademicModule {}
