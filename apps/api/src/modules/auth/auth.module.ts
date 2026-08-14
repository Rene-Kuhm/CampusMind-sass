import { Module } from "@nestjs/common";
import { JwtModule, type JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersService } from "./users.service";
import { PasswordResetService } from "./password-reset.service";
import { SocialAuthController } from "./social-auth.controller";
import { TwoFactorController } from "./two-factor.controller";
import { TwoFactorService } from "./two-factor.service";
import { NotificationsModule } from "../notifications/notifications.module";

// expiresIn is not a plain string in Nest 11: it is ms's StringValue ("7d",
// "2h", ...). Config values are only known at runtime, hence the assertion
// where it is used below.
type ExpiresIn = NonNullable<JwtModuleOptions["signOptions"]>["expiresIn"];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Nest 11 types the secret as a plain string. Reaching this point
        // without one would mean signing tokens with undefined, so fail at
        // startup instead.
        const secret = configService.get<string>("JWT_SECRET");
        if (!secret) {
          throw new Error("JWT_SECRET is not set");
        }
        return {
          secret,
          signOptions: {
            // expiresIn is typed as ms's StringValue ("7d", "2h", ...) rather
            // than a plain string, and config values are only known at
            // runtime, so the value is asserted into that shape.
            expiresIn: configService.get<string>(
              "JWT_EXPIRATION",
              "7d",
            ) as ExpiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    NotificationsModule,
  ],
  controllers: [AuthController, SocialAuthController, TwoFactorController],
  providers: [
    AuthService,
    UsersService,
    JwtStrategy,
    TwoFactorService,
    PasswordResetService,
  ],
  exports: [AuthService, UsersService, TwoFactorService, PasswordResetService],
})
export class AuthModule {}
