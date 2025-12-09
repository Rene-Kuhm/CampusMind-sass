import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreatePostDto,
  CreateCommentDto,
  CreateChallengeDto,
  GroupQueryDto,
  GroupRole,
} from './dto';
import { randomBytes } from 'crypto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // Generate unique group code
  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase();
  }

  async create(userId: string, dto: CreateGroupDto) {
    const code = this.generateCode();

    const group = await this.prisma.studyGroup.create({
      data: {
        name: dto.name,
        description: dto.description,
        avatar: dto.avatar,
        code,
        isPublic: dto.isPublic ?? false,
        subjectName: dto.subjectName,
        university: dto.university,
        career: dto.career,
        maxMembers: dto.maxMembers ?? 50,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        _count: { select: { members: true, posts: true } },
      },
    });

    return group;
  }

  async findAll(userId: string, query: GroupQueryDto) {
    // Get user's groups
    const memberOf = await this.prisma.studyGroupMember.findMany({
      where: { userId, isActive: true },
      select: { groupId: true },
    });
    const memberGroupIds = memberOf.map((m) => m.groupId);

    const where: any = {
      OR: [
        { id: { in: memberGroupIds } },
        ...(query.publicOnly !== false ? [{ isPublic: true }] : []),
      ],
    };

    if (query.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { subjectName: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (query.university) {
      where.university = query.university;
    }

    if (query.career) {
      where.career = query.career;
    }

    const groups = await this.prisma.studyGroup.findMany({
      where,
      include: {
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((group) => ({
      ...group,
      isMember: memberGroupIds.includes(group.id),
    }));
  }

  async findMyGroups(userId: string) {
    const memberships = await this.prisma.studyGroupMember.findMany({
      where: { userId, isActive: true },
      include: {
        group: {
          include: {
            _count: { select: { members: true, posts: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.group,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async findOne(userId: string, id: string) {
    const group = await this.prisma.studyGroup.findFirst({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, posts: true, resources: true, events: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const membership = group.members.find((m) => m.userId === userId);

    if (!group.isPublic && !membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return {
      ...group,
      isMember: !!membership,
      role: membership?.role,
    };
  }

  async joinByCode(userId: string, code: string) {
    const group = await this.prisma.studyGroup.findFirst({
      where: { code: code.toUpperCase() },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      throw new NotFoundException('Invalid group code');
    }

    // Check if already a member
    const existingMembership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId: group.id, userId },
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        throw new BadRequestException('You are already a member');
      }
      // Reactivate membership
      await this.prisma.studyGroupMember.update({
        where: { id: existingMembership.id },
        data: { isActive: true, joinedAt: new Date() },
      });
    } else {
      // Check max members
      if (group._count.members >= group.maxMembers) {
        throw new BadRequestException('Group is full');
      }

      await this.prisma.studyGroupMember.create({
        data: { groupId: group.id, userId, role: 'MEMBER' },
      });
    }

    return this.findOne(userId, group.id);
  }

  async leave(userId: string, groupId: string) {
    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (membership.role === 'OWNER') {
      // Transfer ownership or delete group
      const otherMembers = await this.prisma.studyGroupMember.findMany({
        where: { groupId, userId: { not: userId }, isActive: true },
        orderBy: { joinedAt: 'asc' },
      });

      if (otherMembers.length > 0) {
        // Transfer to oldest admin or member
        const newOwner = otherMembers.find((m) => m.role === 'ADMIN') || otherMembers[0];
        await this.prisma.studyGroupMember.update({
          where: { id: newOwner.id },
          data: { role: 'OWNER' },
        });
      } else {
        // Delete group if no other members
        await this.prisma.studyGroup.delete({ where: { id: groupId } });
        return { success: true, message: 'Group deleted' };
      }
    }

    await this.prisma.studyGroupMember.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    return { success: true };
  }

  async updateMemberRole(userId: string, groupId: string, memberId: string, role: GroupRole) {
    const [requester, target] = await Promise.all([
      this.prisma.studyGroupMember.findFirst({
        where: { groupId, userId, isActive: true },
      }),
      this.prisma.studyGroupMember.findFirst({
        where: { id: memberId, groupId, isActive: true },
      }),
    ]);

    if (!requester || !['OWNER', 'ADMIN'].includes(requester.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === 'OWNER') {
      throw new BadRequestException('Cannot change owner role');
    }

    if (requester.role === 'ADMIN' && role === 'OWNER') {
      throw new ForbiddenException('Only owner can transfer ownership');
    }

    await this.prisma.studyGroupMember.update({
      where: { id: memberId },
      data: { role },
    });

    return { success: true };
  }

  async kickMember(userId: string, groupId: string, memberId: string) {
    const [requester, target] = await Promise.all([
      this.prisma.studyGroupMember.findFirst({
        where: { groupId, userId, isActive: true },
      }),
      this.prisma.studyGroupMember.findFirst({
        where: { id: memberId, groupId, isActive: true },
      }),
    ]);

    if (!requester || !['OWNER', 'ADMIN', 'MODERATOR'].includes(requester.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (!target) {
      throw new NotFoundException('Member not found');
    }

    const roleHierarchy = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 };
    if (roleHierarchy[target.role] >= roleHierarchy[requester.role]) {
      throw new ForbiddenException('Cannot kick member with equal or higher role');
    }

    await this.prisma.studyGroupMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    return { success: true };
  }

  // Posts
  async createPost(userId: string, groupId: string, dto: CreatePostDto) {
    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return this.prisma.groupPost.create({
      data: {
        groupId,
        authorId: userId,
        title: dto.title,
        content: dto.content,
        type: dto.type || 'DISCUSSION',
      },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });
  }

  async getPosts(userId: string, groupId: string, page = 1, limit = 20) {
    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    const group = await this.prisma.studyGroup.findFirst({
      where: { id: groupId },
    });

    if (!group?.isPublic && !membership) {
      throw new ForbiddenException('Access denied');
    }

    const posts = await this.prisma.groupPost.findMany({
      where: { groupId },
      include: {
        author: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { comments: true, likes: true } },
        likes: { where: { userId }, select: { id: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined,
    }));
  }

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.groupPost.findFirst({
      where: { id: postId },
      include: { group: { select: { id: true } } },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId: post.group.id, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const existingLike = await this.prisma.postLike.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.prisma.postLike.delete({ where: { id: existingLike.id } });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({
        data: { postId, userId },
      });
      return { liked: true };
    }
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.groupPost.findFirst({
      where: { id: postId },
      include: { group: { select: { id: true } } },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId: post.group.id, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return this.prisma.postComment.create({
      data: {
        postId,
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
  }

  // Challenges
  async createChallenge(userId: string, groupId: string, dto: CreateChallengeDto) {
    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId, userId, isActive: true },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.groupChallenge.create({
      data: {
        groupId,
        creatorId: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        targetValue: dto.targetValue,
        unit: dto.unit as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        xpReward: dto.xpReward || 0,
      },
    });
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.groupChallenge.findFirst({
      where: { id: challengeId },
      include: { group: { select: { id: true } } },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const membership = await this.prisma.studyGroupMember.findFirst({
      where: { groupId: challenge.group.id, userId, isActive: true },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const existing = await this.prisma.challengeParticipant.findFirst({
      where: { challengeId, userId },
    });

    if (existing) {
      throw new BadRequestException('Already participating');
    }

    return this.prisma.challengeParticipant.create({
      data: { challengeId, userId },
    });
  }

  async getChallengeLeaderboard(challengeId: string) {
    return this.prisma.challengeParticipant.findMany({
      where: { challengeId },
      include: {
        user: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ isCompleted: 'desc' }, { progress: 'desc' }],
    });
  }
}
