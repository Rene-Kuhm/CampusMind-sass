import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { of, throwError } from "rxjs";
import { CrossrefProvider } from "./crossref.provider";
import { SearchQuery } from "../interfaces/academic-resource.interface";

describe("CrossrefProvider", () => {
  let provider: CrossrefProvider;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockCrossrefResponse = {
    status: "ok",
    "message-type": "work-list",
    message: {
      items: [
        {
          DOI: "10.1234/test.2024.001",
          title: ["Test Article Title"],
          author: [
            { given: "John", family: "Doe" },
            { given: "Jane", family: "Smith" },
          ],
          abstract: "<p>This is a test abstract with <b>HTML</b> tags.</p>",
          published: {
            "date-parts": [[2024, 3, 15]],
          },
          type: "journal-article",
          subject: ["Computer Science", "Machine Learning"],
          "is-referenced-by-count": 42,
          "references-count": 25,
          URL: "https://example.com/article",
          "container-title": ["Journal of Testing"],
          publisher: "Test Publisher",
          link: [
            {
              URL: "https://example.com/article.pdf",
              "content-type": "application/pdf",
            },
          ],
          license: [
            {
              URL: "https://creativecommons.org/licenses/by/4.0/",
            },
          ],
        },
      ],
      "total-results": 100,
      "items-per-page": 25,
    },
  };

  const mockSingleWorkResponse = {
    status: "ok",
    "message-type": "work",
    message: {
      DOI: "10.1234/single.work",
      title: ["Single Work Title"],
      author: [{ name: "Organization Author" }],
      "published-online": {
        "date-parts": [[2023, 12]],
      },
      type: "book",
      "is-referenced-by-count": 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrossrefProvider,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<CrossrefProvider>(CrossrefProvider);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("search", () => {
    const baseQuery: SearchQuery = {
      query: "machine learning",
      pagination: { page: 1, perPage: 25 },
    };

    it("should search successfully and normalize results", async () => {
      httpService.get.mockReturnValue(
        of({ data: mockCrossrefResponse } as any),
      );

      const result = await provider.search(baseQuery);

      expect(result.source).toBe("crossref");
      expect(result.total).toBe(100);
      expect(result.items).toHaveLength(1);

      const item = result.items[0];
      expect(item.externalId).toBe("10.1234/test.2024.001");
      expect(item.title).toBe("Test Article Title");
      expect(item.authors).toEqual(["John Doe", "Jane Smith"]);
      expect(item.abstract).toBe("This is a test abstract with HTML tags."); // HTML stripped
      expect(item.publicationDate).toBe("2024-03-15");
      expect(item.publicationYear).toBe(2024);
      expect(item.type).toBe("article");
      expect(item.topics).toEqual(["Computer Science", "Machine Learning"]);
      expect(item.citationCount).toBe(42);
      expect(item.referenceCount).toBe(25);
      expect(item.journal).toBe("Journal of Testing");
      expect(item.publisher).toBe("Test Publisher");
      expect(item.isOpenAccess).toBe(true);
      expect(item.pdfUrl).toBe("https://example.com/article.pdf");
      expect(item.doi).toBe("https://doi.org/10.1234/test.2024.001");
    });

    it("should handle search with filters", async () => {
      httpService.get.mockReturnValue(
        of({ data: mockCrossrefResponse } as any),
      );

      const query: SearchQuery = {
        query: "neural networks",
        filters: {
          isOpenAccess: true,
          yearFrom: 2020,
          yearTo: 2024,
          type: "article",
        },
        pagination: { page: 2, perPage: 10 },
        sort: "citations",
      };

      await provider.search(query);

      expect(httpService.get).toHaveBeenCalled();
      const callUrl = httpService.get.mock.calls[0][0];
      // URL encoded values
      expect(callUrl).toContain("is-oa%3Atrue");
      expect(callUrl).toContain("from-pub-date%3A2020");
      expect(callUrl).toContain("until-pub-date%3A2024");
      expect(callUrl).toContain("type%3Ajournal-article");
      expect(callUrl).toContain("offset=10"); // page 2 with perPage 10
      expect(callUrl).toContain("rows=10");
      expect(callUrl).toContain("sort=is-referenced-by-count");
    });

    it("should handle empty results", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            "message-type": "work-list",
            message: {
              items: [],
              "total-results": 0,
            },
          },
        } as any),
      );

      const result = await provider.search(baseQuery);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it("should handle API errors gracefully", async () => {
      httpService.get.mockReturnValue(throwError(() => new Error("API Error")));

      const result = await provider.search(baseQuery);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.source).toBe("crossref");
    });

    it("should handle non-ok status", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            status: "error",
            message: {},
          },
        } as any),
      );

      const result = await provider.search(baseQuery);

      expect(result.items).toHaveLength(0);
    });

    it("should use polite pool email when configured", async () => {
      configService.get.mockReturnValue("test@example.com");
      httpService.get.mockReturnValue(
        of({ data: mockCrossrefResponse } as any),
      );

      // Recreate provider to pick up config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CrossrefProvider,
          {
            provide: HttpService,
            useValue: httpService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const providerWithEmail = module.get<CrossrefProvider>(CrossrefProvider);
      await providerWithEmail.search(baseQuery);

      expect(httpService.get).toHaveBeenCalled();
      const headers = httpService.get.mock.calls[0][1]?.headers;
      expect(headers?.["User-Agent"]).toContain("mailto:test@example.com");
    });
  });

  describe("getById", () => {
    it("should get work by DOI", async () => {
      httpService.get.mockReturnValue(
        of({ data: mockSingleWorkResponse } as any),
      );

      const result = await provider.getById("10.1234/single.work");

      expect(result).not.toBeNull();
      expect(result?.externalId).toBe("10.1234/single.work");
      expect(result?.title).toBe("Single Work Title");
      expect(result?.authors).toEqual(["Organization Author"]);
      expect(result?.type).toBe("book");
      expect(result?.publicationDate).toBe("2023-12");
    });

    it("should handle DOI without prefix", async () => {
      httpService.get.mockReturnValue(
        of({ data: mockSingleWorkResponse } as any),
      );

      await provider.getById("1234/test");

      // Should add 10. prefix - URL encoded
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining("10.1234%2Ftest"),
        expect.anything(),
      );
    });

    it("should return null on error", async () => {
      httpService.get.mockReturnValue(throwError(() => new Error("Not found")));

      const result = await provider.getById("10.invalid/doi");

      expect(result).toBeNull();
    });

    it("should return null for non-ok status", async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            status: "error",
          },
        } as any),
      );

      const result = await provider.getById("10.1234/test");

      expect(result).toBeNull();
    });
  });

  describe("normalizeWork", () => {
    it("should handle missing optional fields", async () => {
      const minimalWork = {
        DOI: "10.1234/minimal",
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: minimalWork,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/minimal");

      expect(result?.externalId).toBe("10.1234/minimal");
      expect(result?.title).toBe("Sin título");
      expect(result?.authors).toEqual([]);
      expect(result?.abstract).toBeUndefined();
      expect(result?.publicationDate).toBeUndefined();
      expect(result?.type).toBe("paper");
    });

    it("should handle different date formats", async () => {
      const workWithYearOnly = {
        DOI: "10.1234/year-only",
        published: {
          "date-parts": [[2023]],
        },
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithYearOnly,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/year-only");

      expect(result?.publicationDate).toBe("2023");
      expect(result?.publicationYear).toBe(2023);
    });

    it("should handle author with only family name", async () => {
      const workWithPartialAuthor = {
        DOI: "10.1234/partial-author",
        author: [{ family: "Einstein" }],
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithPartialAuthor,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/partial-author");

      expect(result?.authors).toEqual(["Einstein"]);
    });

    it("should strip HTML from abstract", async () => {
      const workWithHtmlAbstract = {
        DOI: "10.1234/html-abstract",
        abstract: "<jats:p><b>Bold</b> and <i>italic</i> text.</jats:p>",
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithHtmlAbstract,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/html-abstract");

      expect(result?.abstract).toBe("Bold and italic text.");
    });

    it("should limit topics to 5", async () => {
      const workWithManySubjects = {
        DOI: "10.1234/many-subjects",
        subject: [
          "Subject 1",
          "Subject 2",
          "Subject 3",
          "Subject 4",
          "Subject 5",
          "Subject 6",
          "Subject 7",
        ],
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithManySubjects,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/many-subjects");

      expect(result?.topics).toHaveLength(5);
    });

    it("should limit authors to 10", async () => {
      const workWithManyAuthors = {
        DOI: "10.1234/many-authors",
        author: Array.from({ length: 15 }, (_, i) => ({
          given: `Author${i}`,
          family: `Family${i}`,
        })),
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithManyAuthors,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/many-authors");

      expect(result?.authors).toHaveLength(10);
    });
  });

  describe("mapWorkType", () => {
    const typeTests = [
      { crossref: "journal-article", expected: "article" },
      { crossref: "book-chapter", expected: "book_chapter" },
      { crossref: "book", expected: "book" },
      { crossref: "proceedings-article", expected: "conference" },
      { crossref: "dissertation", expected: "thesis" },
      { crossref: "posted-content", expected: "preprint" },
      { crossref: "dataset", expected: "dataset" },
      { crossref: "unknown-type", expected: "paper" },
    ];

    typeTests.forEach(({ crossref, expected }) => {
      it(`should map ${crossref} to ${expected}`, async () => {
        httpService.get.mockReturnValue(
          of({
            data: {
              status: "ok",
              message: {
                DOI: "10.1234/test",
                type: crossref,
              },
            },
          } as any),
        );

        const result = await provider.getById("10.1234/test");

        expect(result?.type).toBe(expected);
      });
    });
  });

  describe("checkOpenAccess", () => {
    it("should detect Creative Commons license as open access", async () => {
      const workWithCC = {
        DOI: "10.1234/cc-license",
        license: [{ URL: "https://creativecommons.org/licenses/by/4.0/" }],
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithCC,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/cc-license");

      expect(result?.isOpenAccess).toBe(true);
    });

    it("should detect text-mining link as open access", async () => {
      const workWithTextMining = {
        DOI: "10.1234/text-mining",
        link: [
          {
            URL: "https://example.com/full",
            "intended-application": "text-mining",
          },
        ],
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: workWithTextMining,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/text-mining");

      expect(result?.isOpenAccess).toBe(true);
    });

    it("should return false when no open access indicators", async () => {
      const closedWork = {
        DOI: "10.1234/closed",
      };

      httpService.get.mockReturnValue(
        of({
          data: {
            status: "ok",
            message: closedWork,
          },
        } as any),
      );

      const result = await provider.getById("10.1234/closed");

      expect(result?.isOpenAccess).toBe(false);
    });
  });
});
