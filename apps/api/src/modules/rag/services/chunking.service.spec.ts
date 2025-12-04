import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingService],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
  });

  describe('chunkText', () => {
    const baseMetadata = {
      resourceId: 'res-123',
      resourceTitle: 'Test Resource',
    };

    it('should return single chunk for short text', () => {
      const shortText = 'This is a short text that fits in one chunk.';
      const result = service.chunkText(shortText, baseMetadata);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(shortText);
      expect(result[0].metadata.chunkIndex).toBe(0);
      expect(result[0].metadata.resourceId).toBe('res-123');
    });

    it('should split long text into multiple chunks', () => {
      // Create a long text with multiple paragraphs
      const paragraphs = Array(10)
        .fill(null)
        .map((_, i) => `This is paragraph ${i + 1}. `.repeat(20))
        .join('\n\n');

      const result = service.chunkText(paragraphs, baseMetadata, {
        chunkSize: 500,
        chunkOverlap: 50,
      });

      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk, index) => {
        expect(chunk.metadata.chunkIndex).toBe(index);
        expect(chunk.content.length).toBeLessThanOrEqual(600); // Allow some margin
      });
    });

    it('should preserve metadata across chunks', () => {
      const longText = 'A '.repeat(500) + '\n\n' + 'B '.repeat(500);
      const result = service.chunkText(longText, baseMetadata, {
        chunkSize: 300,
      });

      result.forEach((chunk) => {
        expect(chunk.metadata.resourceId).toBe('res-123');
        expect(chunk.metadata.resourceTitle).toBe('Test Resource');
      });
    });

    it('should handle text with various separators', () => {
      const mixedText =
        'First paragraph.\n\nSecond paragraph.\n\n\n\nThird paragraph.';
      const result = service.chunkText(mixedText, baseMetadata);

      // Should clean up multiple newlines
      expect(result[0].content).not.toContain('\n\n\n');
    });

    it('should handle empty text', () => {
      const result = service.chunkText('', baseMetadata);
      expect(result).toHaveLength(0);
    });

    it('should handle text with only whitespace', () => {
      const result = service.chunkText('   \n\n   \t   ', baseMetadata);
      expect(result).toHaveLength(0);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens based on character count', () => {
      const text = 'This is a test sentence with about forty characters.';
      const estimate = service.estimateTokens(text);

      // ~4 chars per token
      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBe(Math.ceil(text.length / 4));
    });

    it('should return 0 for empty text', () => {
      expect(service.estimateTokens('')).toBe(0);
    });
  });
});
