import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AcademicController } from "./academic.controller";
import { AcademicService } from "./academic.service";
import { OpenAlexProvider } from "./providers/openalex.provider";
import { SemanticScholarProvider } from "./providers/semantic-scholar.provider";
import { CrossrefProvider } from "./providers/crossref.provider";
import { YouTubeProvider } from "./providers/youtube.provider";
import { GoogleBooksProvider } from "./providers/google-books.provider";
import { ArchiveOrgProvider } from "./providers/archive-org.provider";
import { LibGenProvider } from "./providers/libgen.provider";
import { WebSearchProvider } from "./providers/web-search.provider";
import { MedicalBooksProvider } from "./providers/medical-books.provider";

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
      maxRedirects: 3,
    }),
  ],
  controllers: [AcademicController],
  providers: [
    AcademicService,
    // Academic papers
    OpenAlexProvider,
    SemanticScholarProvider,
    CrossrefProvider,
    // Books & Videos
    YouTubeProvider,
    GoogleBooksProvider,
    ArchiveOrgProvider,
    LibGenProvider,
    WebSearchProvider,
    // Medical & Scientific
    MedicalBooksProvider,
  ],
  exports: [AcademicService],
})
export class AcademicModule {}
