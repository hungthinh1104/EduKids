import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { Strategy, VerifyCallback } from "passport-google-oauth20";

/**
 * Tự động tạo callback URL từ PUBLIC_API_BASE_URL.
 * Không cần thay GOOGLE_REDIRECT_URI mỗi lần redeploy.
 *
 * Ví dụ:
 *   PUBLIC_API_BASE_URL = https://edukids-api.azurewebsites.net/api
 *   → callbackURL        = https://edukids-api.azurewebsites.net/auth/google/callback
 */
function buildCallbackUrl(): string {
  const base = process.env.PUBLIC_API_BASE_URL?.trim();
  if (base) {
    // Bỏ phần /api ở cuối (nếu có) để lấy origin của backend
    const origin = base.replace(/\/api\/?$/, "");
    return `${origin}/auth/google/callback`;
  }
  // Fallback khi dev local
  const port = process.env.PORT ?? process.env.BACKEND_PORT ?? "3001";
  return `http://localhost:${port}/auth/google/callback`;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: buildCallbackUrl(),
      scope: ["profile", "email"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;
    const user = {
      provider: "google",
      providerId: id,
      displayName,
      email: emails?.[0]?.value,
      photo: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
