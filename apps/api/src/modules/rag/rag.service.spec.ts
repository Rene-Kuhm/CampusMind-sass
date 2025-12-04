import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RagService } from './rag.service';
import { PrismaService } from '@/database/prisma.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { LlmService } from './services/llm.service';

describe('RagService', () => {
  let service: RagService;
  let prisma: jest.Mocked<PrismaService>;
  let chunking: jest.Mocked<ChunkingService>;
  let embedding: jest.Mocked<EmbeddingService>;
  let vectorStore: jest.Mocked<VectorStoreService>;
  let llm: jest.Mocked<LlmService>;

  const mockResource = {
    id: 'res-123',
    subjectId: 'sub-123',
    title: 'Test Resource',
    authors: ['Author 1'],
    description: 'This is a test description with enough content for indexing.',
    url: 'https://example.com',
    type: 'PAPER',
    level: 'INTERMEDIATE',
    language: 'es',
    isOpenAccess: true,
    license: null,
    externalId: null,
    externalSource: null,
    isIndexed: false,
    indexedAt: null,
    chunkCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockChunks = [
    {
      content: 'Chunk 1 content',
      metadata: { resourceId: 'res-123', resourceTitle: 'Test Resource', chunkIndex: 0 },
    },
    {
      content: 'Chunk 2 content',
      metadata: { resourceId: 'res-123', resourceTitle: 'Test Resource', chunkIndex: 1 },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: PrismaService,
          useValue: {
            resource: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
            ragQuery: {
              create: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: ChunkingService,
          useValue: {
            chunkText: jest.fn(),
          },
        },
        {
          provide: EmbeddingService,
          useValue: {
            generateEmbedding: jest.fn(),
            generateEmbeddings: jest.fn(),
          },
        },
        {
          provide: VectorStoreService,
          useValue: {
            deleteByResource: jest.fn(),
            storeChunks: jest.fn(),
            searchSimilar: jest.fn(),
          },
        },
        {
          provide: LlmService,
          useValue: {
            generateWithContext: jest.fn(),
            generateHarvardSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    prisma = module.get(PrismaService);
    chunking = module.get(ChunkingService);
    embedding = module.get(EmbeddingService);
    vectorStore = module.get(VectorStoreService);
    llm = module.get(LlmService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ingestResource', () => {
    it('should ingest a resource successfully', async () => {
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(mockResource);
      chunking.chunkText.mockReturnValue(mockChunks);
      embedding.generateEmbeddings.mockResolvedValue([
        { embedding: [0.1, 0.2], tokenCount: 10 },
        { embedding: [0.3, 0.4], tokenCount: 10 },
      ]);
      vectorStore.storeChunks.mockResolvedValue(undefined);
      (prisma.resource.update as jest.Mock).mockResolvedValue({
        ...mockResource,
        isIndexed: true,
        chunkCount: 2,
      });

      const result = await service.ingestResource('res-123');

      expect(prisma.resource.findUnique).toHaveBeenCalledWith({
        where: { id: 'res-123' },
      });
      expect(chunking.chunkText).toHaveBeenCalled();
      expect(embedding.generateEmbeddings).toHaveBeenCalled();
      expect(vectorStore.storeChunks).toHaveBeenCalled();
      expect(result.chunksCreated).toBe(2);
      expect(result.tokensUsed).toBe(20);
    });

    it('should throw NotFoundException if resource not found', async () => {
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.ingestResource('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return 0 chunks if content is too short', async () => {
      (prisma.resource.findUnique as jest.Mock).mockResolvedValue({
        ...mockResource,
        description: 'Short',
      });

      const result = await service.ingestResource('res-123');

      expect(result.chunksCreated).toBe(0);
      expect(chunking.chunkText).not.toHaveBeenCalled();
    });
  });

  describe('queryRAG', () => {
    const similarChunks = [
      {
        id: 'chunk-1',
        content: 'Relevant content 1',
        score: 0.9,
        metadata: {
          resourceId: 'res-123',
          resourceTitle: 'Test Resource',
          chunkIndex: 0,
        },
      },
    ];

    it('should query RAG and return response with citations', async () => {
      embedding.generateEmbedding.mockResolvedValue({
        embedding: [0.1, 0.2],
        tokenCount: 5,
      });
      vectorStore.searchSimilar.mockResolvedValue(similarChunks);
      llm.generateWithContext.mockResolvedValue({
        content: 'Generated answer',
        tokensUsed: 50,
      });
      (prisma.ragQuery.create as jest.Mock).mockResolvedValue({ id: 'query-1' });

      const result = await service.queryRAG('user-123', 'What is this about?');

      expect(embedding.generateEmbedding).toHaveBeenCalledWith(
        'What is this about?',
      );
      expect(vectorStore.searchSimilar).toHaveBeenCalled();
      expect(llm.generateWithContext).toHaveBeenCalled();
      expect(result.answer).toBe('Generated answer');
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].resourceId).toBe('res-123');
    });

    it('should return no-results message when no similar chunks found', async () => {
      embedding.generateEmbedding.mockResolvedValue({
        embedding: [0.1, 0.2],
        tokenCount: 5,
      });
      vectorStore.searchSimilar.mockResolvedValue([]);

      const result = await service.queryRAG('user-123', 'Random query');

      expect(result.answer).toContain('No encontré información');
      expect(result.citations).toHaveLength(0);
      expect(llm.generateWithContext).not.toHaveBeenCalled();
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (prisma.ragQuery.count as jest.Mock).mockResolvedValue(10);
      (prisma.ragQuery.aggregate as jest.Mock).mockResolvedValue({
        _sum: { tokensUsed: 500 },
      });
      (prisma.ragQuery.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'q1',
          query: 'Test query',
          createdAt: new Date(),
          tokensUsed: 50,
          subject: { name: 'Math' },
        },
      ]);

      const result = await service.getUserStats('user-123');

      expect(result.totalQueries).toBe(10);
      expect(result.totalTokensUsed).toBe(500);
      expect(result.recentQueries).toHaveLength(1);
    });
  });
});
