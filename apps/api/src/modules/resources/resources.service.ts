import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateResourceDto, ResourceType, ResourceLevel } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

interface ResourceFilters {
  type?: ResourceType;
  level?: ResourceLevel;
  isOpenAccess?: boolean;
  isIndexed?: boolean;
}

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(subjectId: string, userId: string, dto: CreateResourceDto) {
    // Verify subject ownership
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.resource.create({
      data: {
        ...dto,
        subjectId,
      },
    });
  }

  async findAllBySubject(
    subjectId: string,
    userId: string,
    filters?: ResourceFilters,
  ) {
    await this.verifySubjectOwnership(subjectId, userId);

    return this.prisma.resource.findMany({
      where: {
        subjectId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.level && { level: filters.level }),
        ...(filters?.isOpenAccess !== undefined && {
          isOpenAccess: filters.isOpenAccess,
        }),
        ...(filters?.isIndexed !== undefined && { isIndexed: filters.isIndexed }),
      },
      include: {
        _count: {
          select: { chunks: true, notes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id },
      include: {
        subject: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { chunks: true },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Recurso no encontrado');
    }

    // Verify ownership through subject
    await this.verifySubjectOwnership(resource.subjectId, userId);

    return resource;
  }

  async update(id: string, userId: string, dto: UpdateResourceDto) {
    const resource = await this.findOne(id, userId);

    return this.prisma.resource.update({
      where: { id: resource.id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const resource = await this.findOne(id, userId);

    return this.prisma.resource.delete({
      where: { id: resource.id },
    });
  }

  // Add note to resource
  async addNote(resourceId: string, userId: string, content: string) {
    await this.findOne(resourceId, userId);

    return this.prisma.resourceNote.create({
      data: {
        resourceId,
        content,
      },
    });
  }

  // Delete note
  async deleteNote(noteId: string, userId: string) {
    const note = await this.prisma.resourceNote.findUnique({
      where: { id: noteId },
      include: { resource: { include: { subject: true } } },
    });

    if (!note) {
      throw new NotFoundException('Nota no encontrada');
    }

    // Verify ownership
    if (note.resource.subject.userId !== userId) {
      throw new NotFoundException('Nota no encontrada');
    }

    return this.prisma.resourceNote.delete({
      where: { id: noteId },
    });
  }

  private async verifySubjectOwnership(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundException('Materia no encontrada');
    }

    return subject;
  }
}
