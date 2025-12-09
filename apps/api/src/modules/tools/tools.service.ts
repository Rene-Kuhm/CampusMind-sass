import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import {
  CreateFormulaSheetDto,
  UpdateFormulaSheetDto,
  CreateFormulaDto,
  UpdateFormulaDto,
  CreateCodeSnippetDto,
  UpdateCodeSnippetDto,
  ExecuteCodeDto,
  ReorderFormulasDto,
} from "./dto";

// Extended Prisma types
type PrismaWithTools = PrismaService & {
  formulaSheet: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  formula: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
  codeSnippet: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any>;
    findUnique: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
};

export interface FormulaSheet {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  category: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  formulas?: Formula[];
}

export interface Formula {
  id: string;
  sheetId: string;
  name: string;
  latex: string;
  description: string | null;
  variables: Record<string, string> | null;
  example: string | null;
  tags: string[];
  order: number;
  createdAt: Date;
}

export interface CodeSnippet {
  id: string;
  userId: string;
  subjectId: string | null;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[];
  isPublic: boolean;
  isExecutable: boolean;
  lastOutput: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);
  private readonly prisma: PrismaWithTools;

  constructor(prisma: PrismaService) {
    this.prisma = prisma as PrismaWithTools;
  }

  // ==================== FORMULA SHEET OPERATIONS ====================

  /**
   * Create a new formula sheet
   */
  async createFormulaSheet(
    userId: string,
    dto: CreateFormulaSheetDto,
  ): Promise<FormulaSheet> {
    // Validate subject if provided
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const sheet = await this.prisma.formulaSheet.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        subjectId: dto.subjectId,
        isPublic: dto.isPublic ?? false,
      },
    });

    this.logger.log(`Formula sheet created: ${sheet.id} for user ${userId}`);
    return sheet as FormulaSheet;
  }

  /**
   * Get all formula sheets for a user
   */
  async getFormulaSheets(
    userId: string,
    options?: {
      subjectId?: string;
      category?: string;
      search?: string;
    },
  ): Promise<(FormulaSheet & { formulaCount: number })[]> {
    const where: any = { userId };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const sheets = await this.prisma.formulaSheet.findMany({
      where,
      include: {
        _count: {
          select: { formulas: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return sheets.map((sheet: any) => ({
      ...sheet,
      formulaCount: sheet._count.formulas,
      _count: undefined,
    }));
  }

  /**
   * Get a formula sheet by ID
   */
  async getFormulaSheet(
    sheetId: string,
    userId: string,
  ): Promise<FormulaSheet & { formulas: Formula[] }> {
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: {
        id: sheetId,
        OR: [{ userId }, { isPublic: true }],
      },
      include: {
        formulas: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    return sheet as FormulaSheet & { formulas: Formula[] };
  }

  /**
   * Update a formula sheet
   */
  async updateFormulaSheet(
    sheetId: string,
    userId: string,
    dto: UpdateFormulaSheetDto,
  ): Promise<FormulaSheet> {
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: { id: sheetId, userId },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    // Validate subject if being updated
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    const updated = await this.prisma.formulaSheet.update({
      where: { id: sheetId },
      data: dto,
    });

    return updated as FormulaSheet;
  }

  /**
   * Delete a formula sheet
   */
  async deleteFormulaSheet(sheetId: string, userId: string): Promise<void> {
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: { id: sheetId, userId },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    await this.prisma.formulaSheet.delete({
      where: { id: sheetId },
    });

    this.logger.log(`Formula sheet deleted: ${sheetId}`);
  }

  // ==================== FORMULA OPERATIONS ====================

  /**
   * Add a formula to a sheet
   */
  async createFormula(
    sheetId: string,
    userId: string,
    dto: CreateFormulaDto,
  ): Promise<Formula> {
    // Verify sheet belongs to user
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: { id: sheetId, userId },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    // Get the next order if not specified
    let order = dto.order;
    if (order === undefined) {
      const maxOrder = await this.prisma.formula.findFirst({
        where: { sheetId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    const formula = await this.prisma.formula.create({
      data: {
        sheetId,
        name: dto.name,
        latex: dto.latex,
        description: dto.description,
        variables: dto.variables,
        example: dto.example,
        tags: dto.tags ?? [],
        order,
      },
    });

    return formula as Formula;
  }

  /**
   * Get all formulas in a sheet
   */
  async getFormulas(sheetId: string, userId: string): Promise<Formula[]> {
    // Verify access to sheet
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: {
        id: sheetId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    const formulas = await this.prisma.formula.findMany({
      where: { sheetId },
      orderBy: { order: "asc" },
    });

    return formulas as Formula[];
  }

  /**
   * Get a formula by ID
   */
  async getFormula(formulaId: string, userId: string): Promise<Formula> {
    const formula = await this.prisma.formula.findFirst({
      where: { id: formulaId },
      include: { sheet: true },
    });

    if (!formula) {
      throw new NotFoundException("Formula no encontrada");
    }

    // Check access
    if (formula.sheet.userId !== userId && !formula.sheet.isPublic) {
      throw new ForbiddenException("No tienes acceso a esta formula");
    }

    return formula as Formula;
  }

  /**
   * Update a formula
   */
  async updateFormula(
    formulaId: string,
    userId: string,
    dto: UpdateFormulaDto,
  ): Promise<Formula> {
    const formula = await this.prisma.formula.findFirst({
      where: { id: formulaId },
      include: { sheet: true },
    });

    if (!formula) {
      throw new NotFoundException("Formula no encontrada");
    }

    if (formula.sheet.userId !== userId) {
      throw new ForbiddenException("No tienes permisos para editar esta formula");
    }

    const updated = await this.prisma.formula.update({
      where: { id: formulaId },
      data: dto,
    });

    return updated as Formula;
  }

  /**
   * Delete a formula
   */
  async deleteFormula(formulaId: string, userId: string): Promise<void> {
    const formula = await this.prisma.formula.findFirst({
      where: { id: formulaId },
      include: { sheet: true },
    });

    if (!formula) {
      throw new NotFoundException("Formula no encontrada");
    }

    if (formula.sheet.userId !== userId) {
      throw new ForbiddenException("No tienes permisos para eliminar esta formula");
    }

    await this.prisma.formula.delete({
      where: { id: formulaId },
    });
  }

  /**
   * Reorder formulas in a sheet
   */
  async reorderFormulas(
    sheetId: string,
    userId: string,
    dto: ReorderFormulasDto,
  ): Promise<void> {
    // Verify sheet ownership
    const sheet = await this.prisma.formulaSheet.findFirst({
      where: { id: sheetId, userId },
    });

    if (!sheet) {
      throw new NotFoundException("Hoja de formulas no encontrada");
    }

    // Update each formula's order
    await Promise.all(
      dto.formulas.map((item) =>
        this.prisma.formula.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
  }

  // ==================== CODE SNIPPET OPERATIONS ====================

  /**
   * Create a new code snippet
   */
  async createCodeSnippet(
    userId: string,
    dto: CreateCodeSnippetDto,
  ): Promise<CodeSnippet> {
    // Validate subject if provided
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    // Only allow execution for Python and JavaScript
    const isExecutable =
      dto.isExecutable &&
      ["python", "javascript", "typescript"].includes(dto.language);

    const snippet = await this.prisma.codeSnippet.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        code: dto.code,
        language: dto.language,
        tags: dto.tags ?? [],
        subjectId: dto.subjectId,
        isPublic: dto.isPublic ?? false,
        isExecutable: isExecutable ?? false,
      },
    });

    this.logger.log(`Code snippet created: ${snippet.id} for user ${userId}`);
    return snippet as CodeSnippet;
  }

  /**
   * Get all code snippets for a user
   */
  async getCodeSnippets(
    userId: string,
    options?: {
      subjectId?: string;
      language?: string;
      tags?: string[];
      search?: string;
    },
  ): Promise<CodeSnippet[]> {
    const where: any = { userId };

    if (options?.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options?.language) {
      where.language = options.language;
    }

    if (options?.tags?.length) {
      where.tags = { hasSome: options.tags };
    }

    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { code: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const snippets = await this.prisma.codeSnippet.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return snippets as CodeSnippet[];
  }

  /**
   * Get a code snippet by ID
   */
  async getCodeSnippet(snippetId: string, userId: string): Promise<CodeSnippet> {
    const snippet = await this.prisma.codeSnippet.findFirst({
      where: {
        id: snippetId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!snippet) {
      throw new NotFoundException("Snippet de codigo no encontrado");
    }

    return snippet as CodeSnippet;
  }

  /**
   * Update a code snippet
   */
  async updateCodeSnippet(
    snippetId: string,
    userId: string,
    dto: UpdateCodeSnippetDto,
  ): Promise<CodeSnippet> {
    const snippet = await this.prisma.codeSnippet.findFirst({
      where: { id: snippetId, userId },
    });

    if (!snippet) {
      throw new NotFoundException("Snippet de codigo no encontrado");
    }

    // Validate subject if being updated
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, userId },
      });
      if (!subject) {
        throw new NotFoundException("Materia no encontrada");
      }
    }

    // Update isExecutable based on language
    let isExecutable = dto.isExecutable;
    const language = dto.language ?? snippet.language;
    if (isExecutable !== undefined) {
      isExecutable =
        isExecutable &&
        ["python", "javascript", "typescript"].includes(language);
    }

    const updated = await this.prisma.codeSnippet.update({
      where: { id: snippetId },
      data: {
        ...dto,
        isExecutable,
      },
    });

    return updated as CodeSnippet;
  }

  /**
   * Delete a code snippet
   */
  async deleteCodeSnippet(snippetId: string, userId: string): Promise<void> {
    const snippet = await this.prisma.codeSnippet.findFirst({
      where: { id: snippetId, userId },
    });

    if (!snippet) {
      throw new NotFoundException("Snippet de codigo no encontrado");
    }

    await this.prisma.codeSnippet.delete({
      where: { id: snippetId },
    });

    this.logger.log(`Code snippet deleted: ${snippetId}`);
  }

  /**
   * Execute a code snippet (simulated execution)
   * In production, this would use a sandboxed execution environment
   */
  async executeCodeSnippet(
    snippetId: string,
    userId: string,
    dto: ExecuteCodeDto,
  ): Promise<ExecutionResult> {
    const snippet = await this.prisma.codeSnippet.findFirst({
      where: {
        id: snippetId,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!snippet) {
      throw new NotFoundException("Snippet de codigo no encontrado");
    }

    if (!snippet.isExecutable) {
      throw new BadRequestException(
        "Este snippet no esta marcado como ejecutable",
      );
    }

    const startTime = Date.now();

    // Simulated execution - in production, use a sandboxed environment
    // like Docker containers, AWS Lambda, or a code execution service
    const result = await this.simulateExecution(
      snippet.code,
      snippet.language,
      dto.input,
      dto.timeout ?? 5000,
    );

    const executionTime = Date.now() - startTime;

    // Store the output
    if (result.success && snippet.userId === userId) {
      await this.prisma.codeSnippet.update({
        where: { id: snippetId },
        data: { lastOutput: result.output },
      });
    }

    return {
      ...result,
      executionTime,
    };
  }

  /**
   * Simulate code execution (placeholder for actual sandboxed execution)
   */
  private async simulateExecution(
    code: string,
    language: string,
    input?: string,
    timeout: number = 5000,
  ): Promise<Omit<ExecutionResult, "executionTime">> {
    // In production, this would:
    // 1. Spin up a sandboxed container
    // 2. Run the code with proper security restrictions
    // 3. Capture stdout/stderr
    // 4. Return the result

    // For now, we simulate execution based on common patterns
    try {
      // Simulate some processing time
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(100, timeout / 10)),
      );

      // Basic simulation based on language
      if (language === "python") {
        if (code.includes("print(")) {
          // Extract print statements and simulate output
          const printMatches = code.match(/print\([^)]+\)/g);
          if (printMatches) {
            const output = printMatches
              .map((p) => {
                const content = p.slice(6, -1);
                // Simple evaluation for basic cases
                if (content.startsWith('"') || content.startsWith("'")) {
                  return content.slice(1, -1);
                }
                return `[Evaluated: ${content}]`;
              })
              .join("\n");
            return { success: true, output };
          }
        }
        return {
          success: true,
          output: "[Execution completed successfully - no output]",
        };
      }

      if (language === "javascript" || language === "typescript") {
        if (code.includes("console.log(")) {
          const logMatches = code.match(/console\.log\([^)]+\)/g);
          if (logMatches) {
            const output = logMatches
              .map((l) => {
                const content = l.slice(12, -1);
                if (content.startsWith('"') || content.startsWith("'")) {
                  return content.slice(1, -1);
                }
                return `[Evaluated: ${content}]`;
              })
              .join("\n");
            return { success: true, output };
          }
        }
        return {
          success: true,
          output: "[Execution completed successfully - no output]",
        };
      }

      return {
        success: false,
        error: `Ejecucion no soportada para el lenguaje: ${language}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error de ejecucion",
      };
    }
  }

  // ==================== PUBLIC/COMMUNITY OPERATIONS ====================

  /**
   * Get public tools from the community
   */
  async getPublicTools(options?: {
    type?: "formulas" | "snippets" | "all";
    category?: string;
    language?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    formulaSheets: (FormulaSheet & { formulaCount: number; user?: { id: string } })[];
    codeSnippets: (CodeSnippet & { user?: { id: string } })[];
    total: {
      formulaSheets: number;
      codeSnippets: number;
    };
  }> {
    const type = options?.type ?? "all";
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = options?.offset ?? 0;

    let formulaSheets: any[] = [];
    let codeSnippets: any[] = [];
    let totalFormulas = 0;
    let totalSnippets = 0;

    // Get public formula sheets
    if (type === "all" || type === "formulas") {
      const formulaWhere: any = { isPublic: true };

      if (options?.category) {
        formulaWhere.category = options.category;
      }

      if (options?.search) {
        formulaWhere.OR = [
          { title: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } },
        ];
      }

      [formulaSheets, totalFormulas] = await Promise.all([
        this.prisma.formulaSheet.findMany({
          where: formulaWhere,
          include: {
            _count: { select: { formulas: true } },
            user: { select: { id: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { updatedAt: "desc" },
        }),
        this.prisma.formulaSheet.count({ where: formulaWhere }),
      ]);

      formulaSheets = formulaSheets.map((sheet: any) => ({
        ...sheet,
        formulaCount: sheet._count.formulas,
        _count: undefined,
      }));
    }

    // Get public code snippets
    if (type === "all" || type === "snippets") {
      const snippetWhere: any = { isPublic: true };

      if (options?.language) {
        snippetWhere.language = options.language;
      }

      if (options?.search) {
        snippetWhere.OR = [
          { title: { contains: options.search, mode: "insensitive" } },
          { description: { contains: options.search, mode: "insensitive" } },
        ];
      }

      [codeSnippets, totalSnippets] = await Promise.all([
        this.prisma.codeSnippet.findMany({
          where: snippetWhere,
          include: {
            user: { select: { id: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { updatedAt: "desc" },
        }),
        this.prisma.codeSnippet.count({ where: snippetWhere }),
      ]);
    }

    return {
      formulaSheets,
      codeSnippets,
      total: {
        formulaSheets: totalFormulas,
        codeSnippets: totalSnippets,
      },
    };
  }

  /**
   * Clone a public formula sheet to user's collection
   */
  async cloneFormulaSheet(
    sheetId: string,
    userId: string,
  ): Promise<FormulaSheet> {
    const originalSheet = await this.prisma.formulaSheet.findFirst({
      where: { id: sheetId, isPublic: true },
      include: { formulas: true },
    });

    if (!originalSheet) {
      throw new NotFoundException(
        "Hoja de formulas no encontrada o no es publica",
      );
    }

    // Create a copy for the user
    const newSheet = await this.prisma.formulaSheet.create({
      data: {
        userId,
        title: `${originalSheet.title} (Copia)`,
        description: originalSheet.description,
        category: originalSheet.category,
        isPublic: false,
        formulas: {
          create: originalSheet.formulas.map((f: any) => ({
            name: f.name,
            latex: f.latex,
            description: f.description,
            variables: f.variables,
            example: f.example,
            tags: f.tags,
            order: f.order,
          })),
        },
      },
      include: { formulas: true },
    });

    this.logger.log(
      `Formula sheet ${sheetId} cloned to ${newSheet.id} for user ${userId}`,
    );
    return newSheet as FormulaSheet;
  }

  /**
   * Clone a public code snippet to user's collection
   */
  async cloneCodeSnippet(
    snippetId: string,
    userId: string,
  ): Promise<CodeSnippet> {
    const originalSnippet = await this.prisma.codeSnippet.findFirst({
      where: { id: snippetId, isPublic: true },
    });

    if (!originalSnippet) {
      throw new NotFoundException(
        "Snippet de codigo no encontrado o no es publico",
      );
    }

    // Create a copy for the user
    const newSnippet = await this.prisma.codeSnippet.create({
      data: {
        userId,
        title: `${originalSnippet.title} (Copia)`,
        description: originalSnippet.description,
        code: originalSnippet.code,
        language: originalSnippet.language,
        tags: originalSnippet.tags,
        isPublic: false,
        isExecutable: originalSnippet.isExecutable,
      },
    });

    this.logger.log(
      `Code snippet ${snippetId} cloned to ${newSnippet.id} for user ${userId}`,
    );
    return newSnippet as CodeSnippet;
  }

  // ==================== STATS ====================

  /**
   * Get tools statistics for a user
   */
  async getToolsStats(userId: string): Promise<{
    totalFormulaSheets: number;
    totalFormulas: number;
    totalCodeSnippets: number;
    byCategory: { category: string; count: number }[];
    byLanguage: { language: string; count: number }[];
    publicItems: number;
  }> {
    const [
      totalFormulaSheets,
      totalFormulas,
      totalCodeSnippets,
      publicFormulas,
      publicSnippets,
    ] = await Promise.all([
      this.prisma.formulaSheet.count({ where: { userId } }),
      this.prisma.formula.count({
        where: { sheet: { userId } },
      }),
      this.prisma.codeSnippet.count({ where: { userId } }),
      this.prisma.formulaSheet.count({ where: { userId, isPublic: true } }),
      this.prisma.codeSnippet.count({ where: { userId, isPublic: true } }),
    ]);

    // Get category breakdown
    const sheets = await this.prisma.formulaSheet.findMany({
      where: { userId },
      select: { category: true },
    });

    const categoryMap = new Map<string, number>();
    sheets.forEach((s: any) => {
      const cat = s.category || "Sin categoria";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const byCategory = Array.from(categoryMap.entries()).map(
      ([category, count]) => ({ category, count }),
    );

    // Get language breakdown
    const snippets = await this.prisma.codeSnippet.findMany({
      where: { userId },
      select: { language: true },
    });

    const languageMap = new Map<string, number>();
    snippets.forEach((s: any) => {
      languageMap.set(s.language, (languageMap.get(s.language) || 0) + 1);
    });

    const byLanguage = Array.from(languageMap.entries()).map(
      ([language, count]) => ({ language, count }),
    );

    return {
      totalFormulaSheets,
      totalFormulas,
      totalCodeSnippets,
      byCategory,
      byLanguage,
      publicItems: publicFormulas + publicSnippets,
    };
  }
}
