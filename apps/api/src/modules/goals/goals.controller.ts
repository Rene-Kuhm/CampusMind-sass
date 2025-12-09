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
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateGoalDto,
  UpdateGoalDto,
  AddProgressDto,
  GoalQueryDto,
} from './dto';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() query: GoalQueryDto) {
    return this.goalsService.findAll(userId, query);
  }

  @Get('active')
  getActive(@CurrentUser('id') userId: string) {
    return this.goalsService.getActiveGoals(userId);
  }

  @Get('suggestions')
  getSuggestions(@CurrentUser('id') userId: string) {
    return this.goalsService.getSuggestedGoals(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.goalsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, id, dto);
  }

  @Post(':id/progress')
  addProgress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddProgressDto,
  ) {
    return this.goalsService.addProgress(userId, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.goalsService.delete(userId, id);
  }
}
