import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateThreadDto,
  UpdateThreadDto,
  CreateReplyDto,
  ThreadQueryDto,
  CreateCategoryDto,
} from './dto';

@Injectable()
export class ForumsService {
  constructor(private prisma: PrismaService) {}

  // Categories
  async getCategories() {
    return this.prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { threads: true } },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.forumCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
      },
    });
  }

  // Threads
  async createThread(userId: string, dto: CreateThreadDto) {
    const category = await this.prisma.forumCategory.findFirst({
      where: { id: dto.categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.forumThread.create({
      data: {
        categoryId: dto.categoryId,
        authorId: userId,
        title: dto.title,
        content: dto.content,
        tags: dto.tags || [],
      },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        category: { select: { id: true, name: true, color: true } },
        _count: { select: { replies: true, votes: true } },
      },
    });
  }

  async getThreads(userId: string, query: ThreadQueryDto, page = 1, limit = 20) {
    const where: any = {};

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'popular') {
      orderBy = { viewCount: 'desc' };
    } else if (query.sortBy === 'unanswered') {
      where.replyCount = 0;
      orderBy = { createdAt: 'desc' };
    }

    const threads = await this.prisma.forumThread.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        category: { select: { id: true, name: true, color: true } },
        _count: { select: { replies: true, votes: true } },
        votes: { where: { userId }, select: { value: true } },
      },
      orderBy: [{ isPinned: 'desc' }, orderBy],
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await this.prisma.forumThread.count({ where });

    return {
      threads: threads.map((t) => ({
        ...t,
        userVote: t.votes[0]?.value || 0,
        votes: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getThread(userId: string, id: string) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
            userXP: { select: { level: true, totalXP: true } },
          },
        },
        category: { select: { id: true, name: true, color: true } },
        replies: {
          where: { parentId: null },
          include: {
            author: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true } },
                userXP: { select: { level: true } },
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    profile: { select: { firstName: true, lastName: true } },
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            votes: { where: { userId }, select: { value: true } },
          },
          orderBy: [{ isAccepted: 'desc' }, { voteScore: 'desc' }, { createdAt: 'asc' }],
        },
        votes: { where: { userId }, select: { value: true } },
        _count: { select: { replies: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Increment view count
    await this.prisma.forumThread.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...thread,
      userVote: thread.votes[0]?.value || 0,
      votes: undefined,
      replies: thread.replies.map((r) => ({
        ...r,
        userVote: r.votes[0]?.value || 0,
        votes: undefined,
      })),
    };
  }

  async updateThread(userId: string, id: string, dto: UpdateThreadDto) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own threads');
    }

    return this.prisma.forumThread.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        tags: dto.tags,
      },
    });
  }

  async deleteThread(userId: string, id: string) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own threads');
    }

    await this.prisma.forumThread.delete({ where: { id } });
    return { success: true };
  }

  // Replies
  async createReply(userId: string, threadId: string, dto: CreateReplyDto) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.isLocked) {
      throw new ForbiddenException('Thread is locked');
    }

    const reply = await this.prisma.forumReply.create({
      data: {
        threadId,
        authorId: userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Update thread stats
    await this.prisma.forumThread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
        lastReplyAt: new Date(),
      },
    });

    return reply;
  }

  async acceptReply(userId: string, replyId: string) {
    const reply = await this.prisma.forumReply.findFirst({
      where: { id: replyId },
      include: { thread: true },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    if (reply.thread.authorId !== userId) {
      throw new ForbiddenException('Only thread author can accept answers');
    }

    // Unaccept any previously accepted reply
    await this.prisma.forumReply.updateMany({
      where: { threadId: reply.threadId, isAccepted: true },
      data: { isAccepted: false },
    });

    // Accept this reply
    await this.prisma.forumReply.update({
      where: { id: replyId },
      data: { isAccepted: true },
    });

    // Mark thread as solved
    await this.prisma.forumThread.update({
      where: { id: reply.threadId },
      data: { isSolved: true },
    });

    return { success: true };
  }

  // Voting
  async voteThread(userId: string, threadId: string, value: number) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const existingVote = await this.prisma.threadVote.findFirst({
      where: { threadId, userId },
    });

    if (existingVote) {
      if (value === 0) {
        await this.prisma.threadVote.delete({ where: { id: existingVote.id } });
      } else {
        await this.prisma.threadVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else if (value !== 0) {
      await this.prisma.threadVote.create({
        data: { threadId, userId, value },
      });
    }

    // Get updated vote count
    const votes = await this.prisma.threadVote.aggregate({
      where: { threadId },
      _sum: { value: true },
    });

    return { voteScore: votes._sum.value || 0 };
  }

  async voteReply(userId: string, replyId: string, value: number) {
    const reply = await this.prisma.forumReply.findFirst({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Reply not found');
    }

    const existingVote = await this.prisma.replyVote.findFirst({
      where: { replyId, userId },
    });

    if (existingVote) {
      if (value === 0) {
        await this.prisma.replyVote.delete({ where: { id: existingVote.id } });
      } else {
        await this.prisma.replyVote.update({
          where: { id: existingVote.id },
          data: { value },
        });
      }
    } else if (value !== 0) {
      await this.prisma.replyVote.create({
        data: { replyId, userId, value },
      });
    }

    // Update reply vote score
    const votes = await this.prisma.replyVote.aggregate({
      where: { replyId },
      _sum: { value: true },
    });

    const voteScore = votes._sum.value || 0;

    await this.prisma.forumReply.update({
      where: { id: replyId },
      data: { voteScore },
    });

    return { voteScore };
  }

  // Popular tags
  async getPopularTags(limit = 20) {
    const threads = await this.prisma.forumThread.findMany({
      select: { tags: true },
    });

    const tagCounts = new Map<string, number>();
    for (const thread of threads) {
      for (const tag of thread.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
}
