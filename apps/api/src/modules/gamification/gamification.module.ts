import { Module, OnModuleInit } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule implements OnModuleInit {
  constructor(private gamificationService: GamificationService) {}

  async onModuleInit() {
    // Initialize default achievements
    await this.gamificationService.initAchievements();
  }
}
