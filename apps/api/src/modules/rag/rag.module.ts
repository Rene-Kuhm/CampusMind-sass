import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { LlmService } from './services/llm.service';
import { CacheService } from './services/cache.service';
import { ModelDiscoveryService } from './services/model-discovery.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // LLM calls can be slow
    }),
  ],
  controllers: [RagController],
  providers: [
    RagService,
    ChunkingService,
    EmbeddingService,
    VectorStoreService,
    LlmService,
    CacheService,
    ModelDiscoveryService,
  ],
  exports: [RagService, CacheService, ModelDiscoveryService],
})
export class RagModule {}
