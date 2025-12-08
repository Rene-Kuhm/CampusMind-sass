import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { StudyStyle, ContentDepth, User } from "@prisma/client";
import * as crypto from "crypto";

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

interface CreateFromSocialInput {
  email: string;
  provider: "google" | "github";
  socialId: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

interface SocialAccount {
  provider: string;
  socialId: string;
  email: string;
  connectedAt: Date;
}

// In-memory store for social accounts (replace with database when adding SocialAccount model)
const socialAccountsStore = new Map<string, SocialAccount[]>();

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

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

  /**
   * Find user by social account
   * Note: This uses an in-memory store. Add SocialAccount model to Prisma for production.
   */
  async findBySocialAccount(
    provider: "google" | "github",
    socialId: string,
  ): Promise<User | null> {
    // Search through all stored social accounts
    for (const [userId, accounts] of socialAccountsStore.entries()) {
      const found = accounts.find(
        (acc) => acc.provider === provider && acc.socialId === socialId,
      );
      if (found) {
        return this.findById(userId);
      }
    }
    return null;
  }

  /**
   * Link a social account to an existing user
   */
  async linkSocialAccount(
    userId: string,
    provider: "google" | "github",
    socialId: string,
    email: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException("Usuario no encontrado");
    }

    // Check if already linked
    const existingAccounts = socialAccountsStore.get(userId) || [];
    const alreadyLinked = existingAccounts.find(
      (acc) => acc.provider === provider,
    );

    if (alreadyLinked) {
      throw new BadRequestException(
        `Ya tienes una cuenta de ${provider} conectada`,
      );
    }

    // Check if social account is linked to another user
    const existingUser = await this.findBySocialAccount(provider, socialId);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException(
        `Esta cuenta de ${provider} ya está vinculada a otro usuario`,
      );
    }

    // Add to store
    existingAccounts.push({
      provider,
      socialId,
      email,
      connectedAt: new Date(),
    });
    socialAccountsStore.set(userId, existingAccounts);

    this.logger.log(`Linked ${provider} account to user ${userId}`);
  }

  /**
   * Unlink a social account from a user
   */
  async unlinkSocialAccount(
    userId: string,
    provider: "google" | "github",
  ): Promise<void> {
    const accounts = socialAccountsStore.get(userId) || [];
    const filtered = accounts.filter((acc) => acc.provider !== provider);

    if (filtered.length === accounts.length) {
      throw new BadRequestException(
        `No tienes una cuenta de ${provider} conectada`,
      );
    }

    socialAccountsStore.set(userId, filtered);
    this.logger.log(`Unlinked ${provider} account from user ${userId}`);
  }

  /**
   * Get all social accounts linked to a user
   */
  async getSocialAccounts(userId: string): Promise<
    Array<{
      provider: string;
      email: string;
      connectedAt: Date;
    }>
  > {
    const accounts = socialAccountsStore.get(userId) || [];
    return accounts.map((acc) => ({
      provider: acc.provider,
      email: acc.email,
      connectedAt: acc.connectedAt,
    }));
  }

  /**
   * Create a new user from social authentication
   */
  async createFromSocial(data: CreateFromSocialInput): Promise<User> {
    // Generate a random password (user won't use it, they'll login via social)
    const randomPassword = crypto.randomBytes(32).toString("hex");

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: randomPassword,
        emailVerified: true, // Social accounts are pre-verified
        profile: {
          create: {
            firstName: data.profile?.firstName || "Usuario",
            lastName: data.profile?.lastName || "",
          },
        },
      },
      include: { profile: true },
    });

    // Link the social account
    await this.linkSocialAccount(
      user.id,
      data.provider,
      data.socialId,
      data.email,
    );

    this.logger.log(
      `Created user ${user.id} from ${data.provider} authentication`,
    );

    return user;
  }
}
