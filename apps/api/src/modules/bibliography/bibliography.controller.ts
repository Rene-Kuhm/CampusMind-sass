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
import { BibliographyService } from './bibliography.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CreateBibliographyDto,
  CreateCitationDto,
  UpdateCitationDto,
  CitationStyle,
} from './dto';

@Controller('bibliography')
@UseGuards(JwtAuthGuard)
export class BibliographyController {
  constructor(private readonly bibliographyService: BibliographyService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBibliographyDto) {
    return this.bibliographyService.createBibliography(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.bibliographyService.getBibliographies(userId, subjectId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bibliographyService.getBibliography(userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bibliographyService.deleteBibliography(userId, id);
  }

  // Citations
  @Post(':id/citations')
  addCitation(
    @CurrentUser('id') userId: string,
    @Param('id') bibliographyId: string,
    @Body() dto: CreateCitationDto,
  ) {
    return this.bibliographyService.addCitation(userId, bibliographyId, dto);
  }

  @Patch('citations/:citationId')
  updateCitation(
    @CurrentUser('id') userId: string,
    @Param('citationId') citationId: string,
    @Body() dto: UpdateCitationDto,
  ) {
    return this.bibliographyService.updateCitation(userId, citationId, dto);
  }

  @Delete('citations/:citationId')
  deleteCitation(
    @CurrentUser('id') userId: string,
    @Param('citationId') citationId: string,
  ) {
    return this.bibliographyService.deleteCitation(userId, citationId);
  }

  @Get(':id/export')
  export(
    @CurrentUser('id') userId: string,
    @Param('id') bibliographyId: string,
    @Query('style') style: CitationStyle = CitationStyle.APA,
  ) {
    return this.bibliographyService.exportBibliography(userId, bibliographyId, style);
  }

  @Post(':id/import/doi')
  importFromDOI(
    @CurrentUser('id') userId: string,
    @Param('id') bibliographyId: string,
    @Body('doi') doi: string,
  ) {
    return this.bibliographyService.importFromDOI(userId, bibliographyId, doi);
  }
}
