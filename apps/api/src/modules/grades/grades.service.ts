import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { CreateCategoryDto } from "./dto/create-category.dto";

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GRADES
  // ============================================

  async createGrade(subjectId: string, userId: string, dto: CreateGradeDto) {
    // Verify subject ownership
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.grade.create({
      data: {
        subjectId,
        name: dto.name,
        score: dto.score,
        maxScore: dto.maxScore ?? 10,
        weight: dto.weight ?? 1,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async findAllGrades(subjectId: string, userId: string) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.grade.findMany({
      where: { subjectId },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });
  }

  async findOneGrade(id: string, userId: string) {
    const grade = await this.prisma.grade.findFirst({
      where: { id },
      include: {
        category: true,
        subject: true,
      },
    });

    if (!grade) {
      throw new NotFoundException("Nota no encontrada");
    }

    await this.verifySubjectOwnership(grade.subjectId, userId);

    return grade;
  }

  async updateGrade(id: string, userId: string, dto: UpdateGradeDto) {
    await this.findOneGrade(id, userId);

    return this.prisma.grade.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async deleteGrade(id: string, userId: string) {
    await this.findOneGrade(id, userId);

    return this.prisma.grade.delete({
      where: { id },
    });
  }

  // ============================================
  // CATEGORIES
  // ============================================

  async createCategory(
    subjectId: string,
    userId: string,
    dto: CreateCategoryDto,
  ) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.gradeCategory.create({
      data: {
        subjectId,
        name: dto.name,
        weight: dto.weight ?? 1,
        color: dto.color,
      },
    });
  }

  async findAllCategories(subjectId: string, userId: string) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.gradeCategory.findMany({
      where: { subjectId },
      include: {
        grades: {
          orderBy: { date: "desc" },
        },
      },
    });
  }

  async deleteCategory(id: string, userId: string) {
    const category = await this.prisma.gradeCategory.findFirst({
      where: { id },
      include: { subject: true },
    });

    if (!category) {
      throw new NotFoundException("Categoría no encontrada");
    }

    await this.verifySubjectOwnership(category.subjectId, userId);

    return this.prisma.gradeCategory.delete({
      where: { id },
    });
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getSubjectStats(subjectId: string, userId: string) {
    await this.verifySubjectOwnership(subjectId, userId);

    const grades = await this.prisma.grade.findMany({
      where: { subjectId },
      include: { category: true },
    });

    if (grades.length === 0) {
      return {
        subjectId,
        average: 0,
        weightedAverage: 0,
        totalGrades: 0,
        highestGrade: null,
        lowestGrade: null,
        byCategory: [],
      };
    }

    // Calculate basic stats
    const normalizedScores = grades.map(
      (g) => (g.score / g.maxScore) * 10,
    );
    const average =
      normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;

    // Weighted average
    const totalWeight = grades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = grades.reduce(
      (acc, g) => acc + (g.score / g.maxScore) * 10 * g.weight,
      0,
    );
    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Highest and lowest
    const sorted = [...grades].sort(
      (a, b) => b.score / b.maxScore - a.score / a.maxScore,
    );

    // Stats by category
    const categoryMap = new Map<string, typeof grades>();
    for (const grade of grades) {
      const catId = grade.categoryId || "sin-categoria";
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, []);
      }
      categoryMap.get(catId)!.push(grade);
    }

    const byCategory = Array.from(categoryMap.entries()).map(
      ([catId, catGrades]) => {
        const catNormalized = catGrades.map(
          (g) => (g.score / g.maxScore) * 10,
        );
        const catAverage =
          catNormalized.reduce((a, b) => a + b, 0) / catNormalized.length;

        return {
          categoryId: catId === "sin-categoria" ? null : catId,
          categoryName:
            catGrades[0]?.category?.name || "Sin categoría",
          average: Math.round(catAverage * 100) / 100,
          count: catGrades.length,
        };
      },
    );

    return {
      subjectId,
      average: Math.round(average * 100) / 100,
      weightedAverage: Math.round(weightedAverage * 100) / 100,
      totalGrades: grades.length,
      highestGrade: {
        id: sorted[0].id,
        name: sorted[0].name,
        score: sorted[0].score,
        maxScore: sorted[0].maxScore,
      },
      lowestGrade: {
        id: sorted[sorted.length - 1].id,
        name: sorted[sorted.length - 1].name,
        score: sorted[sorted.length - 1].score,
        maxScore: sorted[sorted.length - 1].maxScore,
      },
      byCategory,
    };
  }

  async getUserOverallStats(userId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { userId, isArchived: false },
      include: {
        grades: true,
      },
    });

    const subjectStats = subjects.map((subject) => {
      const grades = subject.grades;
      if (grades.length === 0) {
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          average: 0,
          totalGrades: 0,
        };
      }

      const normalizedScores = grades.map(
        (g) => (g.score / g.maxScore) * 10,
      );
      const average =
        normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length;

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        average: Math.round(average * 100) / 100,
        totalGrades: grades.length,
      };
    });

    const allGrades = subjects.flatMap((s) => s.grades);
    const overallAverage =
      allGrades.length > 0
        ? allGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 10, 0) /
          allGrades.length
        : 0;

    return {
      overallAverage: Math.round(overallAverage * 100) / 100,
      totalSubjects: subjects.length,
      totalGrades: allGrades.length,
      bySubject: subjectStats,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async verifySubjectOwnership(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundException("Materia no encontrada");
    }

    return subject;
  }
}
