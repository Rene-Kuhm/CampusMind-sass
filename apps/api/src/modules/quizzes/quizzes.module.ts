import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { RagModule } from "../rag/rag.module";
import { QuizzesController } from "./quizzes.controller";
import { QuizzesService } from "./quizzes.service";
import { EssayEvaluationService } from "./essay-evaluation.service";

@Module({
  imports: [DatabaseModule, RagModule],
  controllers: [QuizzesController],
  providers: [QuizzesService, EssayEvaluationService],
  exports: [QuizzesService, EssayEvaluationService],
})
export class QuizzesModule {}
