import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { GoogleStrategy } from "./google.strategy";
import { MailModule } from "../mail/mail.module";
import { ChildProfileModule } from "../child-profile/child-profile.module";
import { UserRepository } from "./repositories/user.repository";
import { AuthRateLimitService } from "./services/auth-rate-limit.service";
import { AuthTokenService } from "./services/auth-token.service";
import { AuthPasswordService } from "./services/auth-password.service";

// [C-2 Security Fix] JWT_SECRET must be explicitly set — no insecure fallback.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "❌ SECURITY: JWT_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -base64 64",
  );
}

const hasGoogleOAuthConfig = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() &&
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
);

if (!hasGoogleOAuthConfig) {
  // Keep backend bootable even when Google OAuth is not configured.
  // Google login endpoints will be unavailable until credentials are provided.
  console.warn(
    "[AuthModule] Google OAuth is disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET",
  );
}

@Module({
  imports: [
    MailModule,
    ChildProfileModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: "15m", // Access token expires in 15 minutes
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRateLimitService,
    AuthTokenService,
    AuthPasswordService,
    JwtStrategy,
    ...(hasGoogleOAuthConfig ? [GoogleStrategy] : []),
    UserRepository,
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
