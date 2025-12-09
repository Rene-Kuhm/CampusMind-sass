import { Module } from "@nestjs/common";
import { WritingController } from "./writing.controller";
import { WritingService } from "./writing.service";
import { RagModule } from "../rag/rag.module";

@Module({
  imports: [RagModule],
  controllers: [WritingController],
  providers: [WritingService],
  exports: [WritingService],
})
export class WritingModule {}
