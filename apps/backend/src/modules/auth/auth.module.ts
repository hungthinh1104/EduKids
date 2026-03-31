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

// [C-2 Security Fix] JWT_SECRET must be explicitly set — no insecure fallback.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "❌ SECURITY: JWT_SECRET environment variable is not set. " +
      "Generate one with: openssl rand -base64 64",
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
  providers: [AuthService, JwtStrategy, GoogleStrategy, UserRepository],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
