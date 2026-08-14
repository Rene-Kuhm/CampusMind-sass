import { Test, TestingModule } from "@nestjs/testing";
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
import { PrismaService } from "@/database/prisma.service";
import {
  SearchQuery,
  SearchResult,
  AcademicResource,
} from "./interfaces/academic-resource.interface";

describe("AcademicService", () => {
  let service: AcademicService;
  let openAlex: jest.Mocked<OpenAlexProvider>;
  let semanticScholar: jest.Mocked<SemanticScholarProvider>;
  let crossref: jest.Mocked<CrossrefProvider>;

  const mockResource: AcademicResource = {
    externalId: "W123456789",
    source: "openalex",
    title: "Test Paper Title",
    authors: ["John Doe", "Jane Smith"],
    abstract: "This is a test abstract",
    publicationDate: "2024-01-15",
    publicationYear: 2024,
    type: "article",
    topics: ["Machine Learning", "AI"],
    keywords: ["deep learning", "neural networks"],
    url: "https://example.com/paper",
    pdfUrl: "https://example.com/paper.pdf",
    isOpenAccess: true,
    license: "CC-BY",
    citationCount: 42,
    referenceCount: 30,
    doi: "https://doi.org/10.1234/test",
    journal: "Journal of Testing",
    publisher: "Test Publisher",
  };

  const mockSearchResult: SearchResult = {
    items: [mockResource],
    total: 100,
    page: 1,
    perPage: 25,
    source: "openalex",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        // Each search mock resolves to an empty result by default. Tests that
        // care override it; the ones that reach these providers indirectly
        // (getRecommendations -> searchMultiple) would otherwise get undefined.
        {
          provide: OpenAlexProvider,
          useValue: {
            name: "openalex",
            search: jest.fn().mockResolvedValue({
              source: "openalex",
              total: 0,
              items: [],
            }),
            getById: jest.fn(),
          },
        },
        {
          provide: SemanticScholarProvider,
          useValue: {
            name: "semantic_scholar",
            search: jest.fn().mockResolvedValue({
              source: "semantic_scholar",
              total: 0,
              items: [],
            }),
            getById: jest.fn(),
          },
        },
        {
          provide: CrossrefProvider,
          useValue: {
            name: "crossref",
            search: jest.fn().mockResolvedValue({
              source: "crossref",
              total: 0,
              items: [],
            }),
            getById: jest.fn(),
          },
        },
        // The service takes ten collaborators; the suite only exercises the
        // three above, but Nest still has to resolve the rest.
        ...[
          [YouTubeProvider, "youtube"],
          [GoogleBooksProvider, "google_books"],
          [ArchiveOrgProvider, "archive_org"],
          [LibGenProvider, "libgen"],
          [WebSearchProvider, "web_search"],
          [MedicalBooksProvider, "medical_books"],
        ].map(([provider, name]) => ({
          provide: provider as never,
          useValue: {
            name,
            // searchMultiple reads .source/.total/.items off every result, so
            // an unstubbed provider has to resolve to an empty result, not
            // undefined.
            search: jest.fn().mockResolvedValue({
              source: name,
              total: 0,
              items: [],
            }),
            getById: jest.fn().mockResolvedValue(null),
          },
        })),
        {
          provide: PrismaService,
          useValue: {
            resource: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            subject: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);
    openAlex = module.get(OpenAlexProvider);
    semanticScholar = module.get(SemanticScholarProvider);
    crossref = module.get(CrossrefProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("search", () => {
    const query: SearchQuery = {
      query: "machine learning",
      pagination: { page: 1, perPage: 25 },
    };

    it("should search with OpenAlex by default", async () => {
      openAlex.search.mockResolvedValue(mockSearchResult);

      const result = await service.search(query);

      expect(openAlex.search).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSearchResult);
    });

    it("should search with Semantic Scholar when specified", async () => {
      const ssResult = {
        ...mockSearchResult,
        source: "semantic_scholar" as const,
      };
      semanticScholar.search.mockResolvedValue(ssResult);

      const result = await service.search(query, "semantic_scholar");

      expect(semanticScholar.search).toHaveBeenCalledWith(query);
      expect(result.source).toBe("semantic_scholar");
    });

    it("should search with Crossref when specified", async () => {
      const crResult = { ...mockSearchResult, source: "crossref" as const };
      crossref.search.mockResolvedValue(crResult);

      const result = await service.search(query, "crossref");

      expect(crossref.search).toHaveBeenCalledWith(query);
      expect(result.source).toBe("crossref");
    });
  });

  describe("searchMultiple", () => {
    const query: SearchQuery = {
      query: "deep learning",
      pagination: { page: 1, perPage: 10 },
    };

    it("should search in all sources by default", async () => {
      const openAlexResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "OA1",
            doi: "https://doi.org/10.1/oa",
            source: "openalex",
          },
        ],
        total: 50,
        page: 1,
        perPage: 10,
        source: "openalex",
      };

      const ssResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "SS1",
            doi: "https://doi.org/10.1/ss",
            source: "semantic_scholar",
          },
        ],
        total: 30,
        page: 1,
        perPage: 10,
        source: "semantic_scholar",
      };

      const crResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "CR1",
            doi: "https://doi.org/10.1/cr",
            source: "crossref",
          },
        ],
        total: 20,
        page: 1,
        perPage: 10,
        source: "crossref",
      };

      openAlex.search.mockResolvedValue(openAlexResult);
      semanticScholar.search.mockResolvedValue(ssResult);
      crossref.search.mockResolvedValue(crResult);

      const result = await service.searchMultiple(query);

      expect(openAlex.search).toHaveBeenCalled();
      expect(semanticScholar.search).toHaveBeenCalled();
      expect(crossref.search).toHaveBeenCalled();

      expect(result.results).toHaveLength(3);
      expect(result.totalBySource.openalex).toBe(50);
      expect(result.totalBySource.semantic_scholar).toBe(30);
      expect(result.totalBySource.crossref).toBe(20);
    });

    it("should deduplicate by DOI", async () => {
      const sameDoi = "https://doi.org/10.1234/duplicate";

      const openAlexResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "OA1",
            doi: sameDoi,
            source: "openalex",
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        source: "openalex",
      };

      const crResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "CR1",
            doi: sameDoi,
            source: "crossref",
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        source: "crossref",
      };

      openAlex.search.mockResolvedValue(openAlexResult);
      semanticScholar.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        source: "semantic_scholar",
      });
      crossref.search.mockResolvedValue(crResult);

      const result = await service.searchMultiple(query);

      // Should only have 1 result due to DOI deduplication
      expect(result.results).toHaveLength(1);
      expect(result.results[0].source).toBe("openalex"); // First one wins
    });

    it("should keep items without DOI using source:externalId key", async () => {
      const openAlexResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "OA1",
            // url has to go too: the key is doi || url || source:externalId,
            // and mockResource carries a url both items would share.
            doi: undefined,
            url: undefined,
            source: "openalex",
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        source: "openalex",
      };

      const crResult: SearchResult = {
        items: [
          {
            ...mockResource,
            externalId: "CR1",
            doi: undefined,
            url: undefined,
            source: "crossref",
          },
        ],
        total: 1,
        page: 1,
        perPage: 10,
        source: "crossref",
      };

      openAlex.search.mockResolvedValue(openAlexResult);
      semanticScholar.search.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        source: "semantic_scholar",
      });
      crossref.search.mockResolvedValue(crResult);

      const result = await service.searchMultiple(query);

      // Both should be kept since they don't share DOI
      expect(result.results).toHaveLength(2);
    });

    it("should handle provider errors gracefully", async () => {
      openAlex.search.mockResolvedValue(mockSearchResult);
      semanticScholar.search.mockRejectedValue(new Error("API Error"));
      crossref.search.mockRejectedValue(new Error("Timeout"));

      const result = await service.searchMultiple(query);

      // Should still return results from OpenAlex
      expect(result.results).toHaveLength(1);
      expect(result.totalBySource.openalex).toBe(100);
      expect(result.totalBySource.semantic_scholar).toBe(0);
      expect(result.totalBySource.crossref).toBe(0);
    });

    it("should search only specified sources", async () => {
      openAlex.search.mockResolvedValue(mockSearchResult);
      crossref.search.mockResolvedValue({
        ...mockSearchResult,
        source: "crossref",
      });

      await service.searchMultiple(query, ["openalex", "crossref"]);

      expect(openAlex.search).toHaveBeenCalled();
      expect(crossref.search).toHaveBeenCalled();
      expect(semanticScholar.search).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should get resource from OpenAlex", async () => {
      openAlex.getById.mockResolvedValue(mockResource);

      const result = await service.getById("W123", "openalex");

      expect(openAlex.getById).toHaveBeenCalledWith("W123");
      expect(result).toEqual(mockResource);
    });

    it("should get resource from Semantic Scholar", async () => {
      const ssResource = {
        ...mockResource,
        source: "semantic_scholar" as const,
      };
      semanticScholar.getById.mockResolvedValue(ssResource);

      const result = await service.getById("paper123", "semantic_scholar");

      expect(semanticScholar.getById).toHaveBeenCalledWith("paper123");
      expect(result?.source).toBe("semantic_scholar");
    });

    it("should get resource from Crossref", async () => {
      const crResource = { ...mockResource, source: "crossref" as const };
      crossref.getById.mockResolvedValue(crResource);

      const result = await service.getById("10.1234/test", "crossref");

      expect(crossref.getById).toHaveBeenCalledWith("10.1234/test");
      expect(result?.source).toBe("crossref");
    });

    it("should return null for unknown source", async () => {
      const result = await service.getById("id", "unknown" as any);

      expect(result).toBeNull();
    });

    it("should return null when resource not found", async () => {
      openAlex.getById.mockResolvedValue(null);

      const result = await service.getById("invalid", "openalex");

      expect(result).toBeNull();
    });
  });

  describe("getRecommendations", () => {
    it("should return recommendations based on topics", async () => {
      openAlex.search.mockResolvedValue({
        ...mockSearchResult,
        // Distinct DOIs: results are deduplicated by DOI, so reusing
        // mockResource's would collapse these two into one.
        items: [
          mockResource,
          {
            ...mockResource,
            externalId: "W2",
            doi: "https://doi.org/10.1234/test-2",
          },
        ],
      });

      const result = await service.getRecommendations(["AI", "ML"]);

      expect(openAlex.search).toHaveBeenCalledWith({
        query: "AI OR ML",
        filters: { isOpenAccess: true },
        pagination: { page: 1, perPage: 10 },
        sort: "relevance",
      });
      expect(result).toHaveLength(2);
    });

    it("should return empty array for no topics", async () => {
      const result = await service.getRecommendations([]);

      expect(result).toHaveLength(0);
      expect(openAlex.search).not.toHaveBeenCalled();
    });

    it("should respect options", async () => {
      openAlex.search.mockResolvedValue({
        items: [mockResource],
        total: 1,
        page: 1,
        perPage: 5,
        source: "openalex",
      });

      await service.getRecommendations(["topic1"], {
        isOpenAccess: false,
        limit: 5,
      });

      expect(openAlex.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { isOpenAccess: false },
          pagination: { page: 1, perPage: 5 },
        }),
      );
    });

    it("should default to open access true", async () => {
      openAlex.search.mockResolvedValue(mockSearchResult);

      await service.getRecommendations(["topic"]);

      expect(openAlex.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { isOpenAccess: true },
        }),
      );
    });
  });
});
