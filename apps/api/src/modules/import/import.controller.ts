import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ImportService } from "./import.service";
import {
  ImportDataDto,
  ImportFlashcardsDto,
  ImportTasksDto,
  ParseCsvDto,
  ExportDataDto,
} from "./dto/import.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";

interface User {
  id: string;
  email: string;
}

@ApiTags("import")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("import")
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post("parse-csv")
  @ApiOperation({ summary: "Parse CSV content and return structured data" })
  @ApiResponse({ status: 200, description: "CSV parsed successfully" })
  parseCsv(@Body() dto: ParseCsvDto) {
    return this.importService.parseCsv(dto);
  }

  @Post("flashcards")
  @ApiOperation({ summary: "Import flashcards from structured data" })
  @ApiResponse({ status: 201, description: "Flashcards imported" })
  importFlashcards(
    @CurrentUser() user: User,
    @Body() dto: ImportFlashcardsDto,
  ) {
    return this.importService.importFlashcards(user.id, dto);
  }

  @Post("tasks")
  @ApiOperation({ summary: "Import tasks from structured data" })
  @ApiResponse({ status: 201, description: "Tasks imported" })
  importTasks(@CurrentUser() user: User, @Body() dto: ImportTasksDto) {
    return this.importService.importTasks(user.id, dto);
  }

  @Post("data")
  @ApiOperation({ summary: "Generic import from CSV/JSON" })
  @ApiResponse({ status: 201, description: "Data imported" })
  importData(@CurrentUser() user: User, @Body() dto: ImportDataDto) {
    return this.importService.importData(user.id, dto);
  }

  @Post("export")
  @ApiOperation({ summary: "Export data to CSV/JSON" })
  @ApiResponse({ status: 200, description: "Data exported" })
  async exportData(
    @CurrentUser() user: User,
    @Body() dto: ExportDataDto,
    @Res() res: Response,
  ) {
    const result = await this.importService.exportData(user.id, dto);

    res.setHeader("Content-Type", result.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }

  @Get("templates")
  @ApiOperation({ summary: "Get import templates with example data" })
  @ApiResponse({ status: 200, description: "Templates retrieved" })
  getTemplates() {
    return this.importService.getTemplates();
  }
}
