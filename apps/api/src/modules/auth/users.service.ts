import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { StudyStyle, ContentDepth } from "@prisma/client";

interface CreateUserInput {
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    career?: string;
    year?: number;
    university?: string;
  };
}

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  career?: string;
  year?: number;
  university?: string;
  studyStyle?: StudyStyle;
  contentDepth?: ContentDepth;
  preferredLang?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async create(data: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        profile: {
          create: {
            firstName: data.profile.firstName,
            lastName: data.profile.lastName,
            career: data.profile.career,
            year: data.profile.year,
            university: data.profile.university,
          },
        },
      },
      include: { profile: true },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
    });
  }
}
