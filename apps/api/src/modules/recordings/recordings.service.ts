import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import {
  CreateRecordingDto,
  UpdateRecordingDto,
  CreateBookmarkDto,
  CreateRecordingNoteDto,
} from './dto';

export interface RecordingFilters {
  isFavorite?: boolean;
  isProcessed?: boolean;
  tags?: string[];
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class RecordingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new audio recording
   */
  async create(userId: string, dto: CreateRecordingDto) {
    // Verify subject ownership if subjectId is provided
    if (dto.subjectId) {
      await this.verifySubjectOwnership(dto.subjectId, userId);
    }

    return this.prisma.audioRecording.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        duration: dto.duration,
        subjectId: dto.subjectId,
        location: dto.location,
        professorName: dto.professorName,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        tags: dto.tags ?? [],
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            bookmarks: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Get all recordings for a user with optional filters and pagination
   */
  async findAll(
    userId: string,
    filters?: RecordingFilters,
    pagination?: PaginationOptions,
  ) {
    const page = pagination?.page ?? 1;
    const limit = Math.min(pagination?.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(filters?.isFavorite !== undefined && { isFavorite: filters.isFavorite }),
      ...(filters?.isProcessed !== undefined && { isProcessed: filters.isProcessed }),
      ...(filters?.tags?.length && {
        tags: {
          hasSome: filters.tags,
        },
      }),
    };

    const [recordings, total] = await Promise.all([
      this.prisma.audioRecording.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              bookmarks: true,
              notes: true,
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.audioRecording.count({ where }),
    ]);

    return {
      data: recordings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single recording by ID
   */
  async findOne(id: string, userId: string) {
    const recording = await this.prisma.audioRecording.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        bookmarks: {
          orderBy: { timestamp: 'asc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!recording) {
      throw new NotFoundException('Recording not found');
    }

    if (recording.userId !== userId) {
      throw new ForbiddenException('Access denied to this recording');
    }

    return recording;
  }

  /**
   * Update a recording
   */
  async update(id: string, userId: string, dto: UpdateRecordingDto) {
    const recording = await this.findOne(id, userId);

    // Verify new subject ownership if changing subject
    if (dto.subjectId && dto.subjectId !== recording.subjectId) {
      await this.verifySubjectOwnership(dto.subjectId, userId);
    }

    return this.prisma.audioRecording.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.subjectId !== undefined && { subjectId: dto.subjectId }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.professorName !== undefined && { professorName: dto.professorName }),
        ...(dto.recordedAt !== undefined && { recordedAt: new Date(dto.recordedAt) }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.isProcessed !== undefined && { isProcessed: dto.isProcessed }),
        ...(dto.isFavorite !== undefined && { isFavorite: dto.isFavorite }),
        ...(dto.transcriptionId !== undefined && { transcriptionId: dto.transcriptionId }),
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            bookmarks: true,
            notes: true,
          },
        },
      },
    });
  }

  /**
   * Delete a recording
   */
  async delete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.audioRecording.delete({
      where: { id },
    });
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string, userId: string) {
    const recording = await this.findOne(id, userId);

    return this.prisma.audioRecording.update({
      where: { id },
      data: {
        isFavorite: !recording.isFavorite,
      },
    });
  }

  /**
   * Get recordings by subject
   */
  async findBySubject(
    subjectId: string,
    userId: string,
    pagination?: PaginationOptions,
  ) {
    await this.verifySubjectOwnership(subjectId, userId);

    const page = pagination?.page ?? 1;
    const limit = Math.min(pagination?.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      subjectId,
    };

    const [recordings, total] = await Promise.all([
      this.prisma.audioRecording.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          _count: {
            select: {
              bookmarks: true,
              notes: true,
            },
          },
        },
        orderBy: { recordedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.audioRecording.count({ where }),
    ]);

    return {
      data: recordings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==================== BOOKMARKS ====================

  /**
   * Add a bookmark to a recording
   */
  async addBookmark(recordingId: string, userId: string, dto: CreateBookmarkDto) {
    const recording = await this.findOne(recordingId, userId);

    // Validate timestamp is within recording duration
    if (dto.timestamp > recording.duration) {
      throw new ForbiddenException(
        `Timestamp ${dto.timestamp}s exceeds recording duration of ${recording.duration}s`,
      );
    }

    return this.prisma.recordingBookmark.create({
      data: {
        recordingId,
        timestamp: dto.timestamp,
        label: dto.label,
        color: dto.color,
      },
    });
  }

  /**
   * Get all bookmarks for a recording
   */
  async getBookmarks(recordingId: string, userId: string) {
    await this.findOne(recordingId, userId);

    return this.prisma.recordingBookmark.findMany({
      where: { recordingId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Delete a bookmark
   */
  async deleteBookmark(bookmarkId: string, userId: string) {
    const bookmark = await this.prisma.recordingBookmark.findUnique({
      where: { id: bookmarkId },
      include: {
        recording: {
          select: { userId: true },
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.recording.userId !== userId) {
      throw new ForbiddenException('Access denied to this bookmark');
    }

    return this.prisma.recordingBookmark.delete({
      where: { id: bookmarkId },
    });
  }

  // ==================== NOTES ====================

  /**
   * Add a note to a recording
   */
  async addNote(recordingId: string, userId: string, dto: CreateRecordingNoteDto) {
    const recording = await this.findOne(recordingId, userId);

    // Validate timestamp is within recording duration if provided
    if (dto.timestamp !== undefined && dto.timestamp > recording.duration) {
      throw new ForbiddenException(
        `Timestamp ${dto.timestamp}s exceeds recording duration of ${recording.duration}s`,
      );
    }

    return this.prisma.recordingNote.create({
      data: {
        recordingId,
        content: dto.content,
        timestamp: dto.timestamp,
      },
    });
  }

  /**
   * Get all notes for a recording
   */
  async getNotes(recordingId: string, userId: string) {
    await this.findOne(recordingId, userId);

    return this.prisma.recordingNote.findMany({
      where: { recordingId },
      orderBy: [{ timestamp: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Update a note
   */
  async updateNote(noteId: string, userId: string, content: string) {
    const note = await this.prisma.recordingNote.findUnique({
      where: { id: noteId },
      include: {
        recording: {
          select: { userId: true },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.recording.userId !== userId) {
      throw new ForbiddenException('Access denied to this note');
    }

    return this.prisma.recordingNote.update({
      where: { id: noteId },
      data: { content },
    });
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string, userId: string) {
    const note = await this.prisma.recordingNote.findUnique({
      where: { id: noteId },
      include: {
        recording: {
          select: { userId: true },
        },
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.recording.userId !== userId) {
      throw new ForbiddenException('Access denied to this note');
    }

    return this.prisma.recordingNote.delete({
      where: { id: noteId },
    });
  }

  // ==================== STATISTICS ====================

  /**
   * Get recording statistics for a user
   */
  async getStatistics(userId: string) {
    const [totalRecordings, totalDuration, bySubject, recentRecordings] =
      await Promise.all([
        this.prisma.audioRecording.count({
          where: { userId },
        }),
        this.prisma.audioRecording.aggregate({
          where: { userId },
          _sum: { duration: true },
          _avg: { duration: true },
        }),
        this.prisma.audioRecording.groupBy({
          by: ['subjectId'],
          where: { userId },
          _count: true,
          _sum: { duration: true },
        }),
        this.prisma.audioRecording.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            duration: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      totalRecordings,
      totalDuration: totalDuration._sum.duration ?? 0,
      averageDuration: Math.round(totalDuration._avg.duration ?? 0),
      bySubject,
      recentRecordings,
    };
  }

  // ==================== HELPERS ====================

  /**
   * Verify that the user owns the subject
   */
  private async verifySubjectOwnership(subjectId: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found or access denied');
    }

    return subject;
  }
}
