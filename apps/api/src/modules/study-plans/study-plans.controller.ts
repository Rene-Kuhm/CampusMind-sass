import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudyPlansService } from './study-plans.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateStudyPlanDto, GeneratePlanDto, UpdatePlanItemDto } from './dto';

@Controller('study-plans')
@UseGuards(JwtAuthGuard)
export class StudyPlansController {
  constructor(private readonly studyPlansService: StudyPlansService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateStudyPlanDto) {
    return this.studyPlansService.createPlan(userId, dto);
  }

  @Post('generate')
  generateWithAI(@CurrentUser('id') userId: string, @Body() dto: GeneratePlanDto) {
    return this.studyPlansService.generateWithAI(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.studyPlansService.getPlans(userId, subjectId);
  }

  @Get('today')
  getTodayItems(@CurrentUser('id') userId: string) {
    return this.studyPlansService.getTodayItems(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.studyPlansService.getPlan(userId, id);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlanItemDto,
  ) {
    return this.studyPlansService.updatePlanItem(userId, itemId, dto);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.studyPlansService.deletePlan(userId, id);
  }
}
