import { Module } from "@nestjs/common";
import { MindMapsController } from "./mindmaps.controller";
import { MindMapsService } from "./mindmaps.service";

@Module({
  controllers: [MindMapsController],
  providers: [MindMapsService],
  exports: [MindMapsService],
})
export class MindMapsModule {}
