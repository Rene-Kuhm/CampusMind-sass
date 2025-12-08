import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  UseGuards,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { User } from "@prisma/client";
import { UsersService } from "./users.service";

interface SocialAuthCallbackDto {
  code: string;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface GitHubAccessToken {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

@ApiTags("auth")
@Controller("auth/social")
export class SocialAuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Google OAuth callback
   */
  @Post("google/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate with Google OAuth" })
  @ApiResponse({ status: 200, description: "Authentication successful" })
  @ApiResponse({
    status: 400,
    description: "Invalid code or authentication failed",
  })
  async googleCallback(@Body() body: SocialAuthCallbackDto) {
    const { code } = body;

    if (!code) {
      throw new BadRequestException("Código de autorización requerido");
    }

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeGoogleCode(code);

      // Get user info from Google
      const googleUser = await this.getGoogleUserInfo(tokens.access_token);

      // Find or create user
      const user = await this.findOrCreateSocialUser("google", googleUser.sub, {
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        avatar: googleUser.picture,
      });

      // Generate JWT
      const accessToken = this.generateToken(user.id, user.email);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          provider: "google",
        },
      };
    } catch (error) {
      throw new BadRequestException(
        "Error al autenticar con Google: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  /**
   * GitHub OAuth callback
   */
  @Post("github/callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Authenticate with GitHub OAuth" })
  @ApiResponse({ status: 200, description: "Authentication successful" })
  @ApiResponse({
    status: 400,
    description: "Invalid code or authentication failed",
  })
  async githubCallback(@Body() body: SocialAuthCallbackDto) {
    const { code } = body;

    if (!code) {
      throw new BadRequestException("Código de autorización requerido");
    }

    try {
      // Exchange code for access token
      const accessToken = await this.exchangeGitHubCode(code);

      // Get user info from GitHub
      const githubUser = await this.getGitHubUserInfo(accessToken);

      // Get email if not public
      let email = githubUser.email;
      if (!email) {
        email = await this.getGitHubPrimaryEmail(accessToken);
      }

      // Find or create user
      const user = await this.findOrCreateSocialUser(
        "github",
        githubUser.id.toString(),
        {
          email: email || `${githubUser.login}@github.local`,
          firstName: githubUser.name?.split(" ")[0],
          lastName: githubUser.name?.split(" ").slice(1).join(" "),
          avatar: githubUser.avatar_url,
        },
      );

      // Generate JWT
      const jwtToken = this.generateToken(user.id, user.email);

      return {
        accessToken: jwtToken,
        user: {
          id: user.id,
          email: user.email,
          name: githubUser.name || githubUser.login,
          avatar: githubUser.avatar_url,
          provider: "github",
        },
      };
    } catch (error) {
      throw new BadRequestException(
        "Error al autenticar con GitHub: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  /**
   * Connect social account to existing user
   */
  @Post(":provider/connect")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Connect a social account to existing user" })
  @ApiParam({ name: "provider", enum: ["google", "github"] })
  @ApiResponse({ status: 200, description: "Account connected successfully" })
  async connectSocialAccount(
    @Param("provider") provider: "google" | "github",
    @Body() body: SocialAuthCallbackDto,
    @CurrentUser() user: User,
  ) {
    const { code } = body;

    if (!code) {
      throw new BadRequestException("Código de autorización requerido");
    }

    try {
      let socialId: string;
      let socialEmail: string;

      if (provider === "google") {
        const tokens = await this.exchangeGoogleCode(code);
        const googleUser = await this.getGoogleUserInfo(tokens.access_token);
        socialId = googleUser.sub;
        socialEmail = googleUser.email;
      } else {
        const accessToken = await this.exchangeGitHubCode(code);
        const githubUser = await this.getGitHubUserInfo(accessToken);
        socialId = githubUser.id.toString();
        socialEmail = githubUser.email || `${githubUser.login}@github.local`;
      }

      // Link social account to user
      await this.usersService.linkSocialAccount(
        user.id,
        provider,
        socialId,
        socialEmail,
      );

      return {
        success: true,
        message: `Cuenta de ${provider} conectada exitosamente`,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al conectar cuenta de ${provider}: ` +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

  /**
   * Disconnect social account from user
   */
  @Delete(":provider/disconnect")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Disconnect a social account from user" })
  @ApiParam({ name: "provider", enum: ["google", "github"] })
  @ApiResponse({
    status: 200,
    description: "Account disconnected successfully",
  })
  async disconnectSocialAccount(
    @Param("provider") provider: "google" | "github",
    @CurrentUser() user: User,
  ) {
    await this.usersService.unlinkSocialAccount(user.id, provider);

    return {
      success: true,
      message: `Cuenta de ${provider} desconectada`,
    };
  }

  /**
   * Get connected social accounts
   */
  @Get("accounts")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all connected social accounts" })
  @ApiResponse({ status: 200, description: "List of connected accounts" })
  async getConnectedAccounts(@CurrentUser() user: User) {
    return this.usersService.getSocialAccounts(user.id);
  }

  // === Private helper methods ===

  private async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET");
    const redirectUri = this.configService.get<string>("GOOGLE_REDIRECT_URI");

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri || "",
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token exchange failed: ${error}`);
    }

    return response.json();
  }

  private async getGoogleUserInfo(
    accessToken: string,
  ): Promise<GoogleUserInfo> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to get Google user info");
    }

    return response.json();
  }

  private async exchangeGitHubCode(code: string): Promise<string> {
    const clientId = this.configService.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = this.configService.get<string>("GITHUB_CLIENT_SECRET");

    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("GitHub token exchange failed");
    }

    const data: GitHubAccessToken = await response.json();
    return data.access_token;
  }

  private async getGitHubUserInfo(accessToken: string): Promise<GitHubUser> {
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get GitHub user info");
    }

    return response.json();
  }

  private async getGitHubPrimaryEmail(
    accessToken: string,
  ): Promise<string | null> {
    const response = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const emails: Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }> = await response.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified);

    return primaryEmail?.email || emails[0]?.email || null;
  }

  private async findOrCreateSocialUser(
    provider: "google" | "github",
    socialId: string,
    userData: {
      email: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    },
  ): Promise<User> {
    // Try to find existing user by social account
    let user = await this.usersService.findBySocialAccount(provider, socialId);

    if (user) {
      return user;
    }

    // Try to find by email
    user = await this.usersService.findByEmail(userData.email);

    if (user) {
      // Link social account to existing user
      await this.usersService.linkSocialAccount(
        user.id,
        provider,
        socialId,
        userData.email,
      );
      return user;
    }

    // Create new user
    user = await this.usersService.createFromSocial({
      email: userData.email,
      provider,
      socialId,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatar: userData.avatar,
      },
    });

    return user;
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}
