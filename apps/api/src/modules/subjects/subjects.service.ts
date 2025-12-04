import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        resources: true,
      },
    });
  }

  async findAllByUser(userId: string, includeArchived = false) {
    return this.prisma.subject.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, userId },
      include: {
        resources: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    return subject;
  }

  async update(id: string, userId: string, dto: UpdateSubjectDto) {
    await this.findOne(id, userId); // Verify ownership

    return this.prisma.subject.update({
      where: { id },
      data: dto,
      include: {
        resources: true,
      },
    });
  }

  async archive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.subject.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async unarchive(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.subject.update({
      where: { id },
      data: { isArchived: false },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
