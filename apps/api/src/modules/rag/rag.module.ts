import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RagController } from './rag.controller';
import { NotebookController } from './notebook.controller';
import { RagService } from './rag.service';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { LlmService } from './services/llm.service';
import { CacheService } from './services/cache.service';
import { ModelDiscoveryService } from './services/model-discovery.service';
import { TTSService } from './services/tts.service';
import { QuestionGeneratorService } from './services/question-generator.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000, // TTS and LLM calls can be slow
    }),
  ],
  controllers: [RagController, NotebookController],
  providers: [
    RagService,
    ChunkingService,
    EmbeddingService,
    VectorStoreService,
    LlmService,
    CacheService,
    ModelDiscoveryService,
    TTSService,
    QuestionGeneratorService,
  ],
  exports: [
    RagService,
    CacheService,
    ModelDiscoveryService,
    TTSService,
    QuestionGeneratorService,
    LlmService,
  ],
})
export class RagModule {}
