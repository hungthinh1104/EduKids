import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  Throttle,
  SkipThrottle,
} from "../../common/decorators/throttle.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { SwitchProfileDto } from "./dto/switch-profile.dto";
import {
  AuthResponseDto,
  SwitchProfileResponseDto,
} from "./dto/auth-response.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * UC-00: Register new parent account
   */
  @Public()
  @ApiOperation({
    summary: "Register new parent account",
    description:
      "Create new parent account with email/password. Returns JWT tokens.",
  })
  @ApiResponse({
    status: 201,
    description: "Account created successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "Email already exists" })
  @Throttle(5, 60) // 5 registration attempts per 60 seconds
  @Post("register")
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * UC-00: Login with email/password
   * Exception: Rate limiting after 5 failed attempts
   */
  @Public()
  @ApiOperation({
    summary: "Login to get JWT token",
    description:
      "Authenticate with email/password. Rate limited to 10 attempts per 60s. Account locked for 5 minutes after 5 failed attempts.",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({
    status: 403,
    description: "Account temporarily locked after 5 failed attempts",
  })
  @Throttle(10, 60) // 10 login attempts per 60 seconds
  @HttpCode(HttpStatus.OK)
  @Post("login")
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * UC-00: Refresh JWT token
   * Alternative Flow: OAuth token expired
   */
  @Public()
  @ApiOperation({
    summary: "Refresh JWT token",
    description: "Get new access token using refresh token",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed",
    schema: {
      properties: {
        accessToken: { type: "string" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Session expired, please log in again",
  })
  @Post("refresh")
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * UC-00: Switch to child profile (get learner token)
   * Step 3: Role-based redirect to Learning Dashboard
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Switch to child profile (get learner token)",
    description:
      "Parent switches to child profile. Returns learner JWT with childId claim for learning activities.",
  })
  @ApiResponse({
    status: 200,
    description: "Switched to child profile",
    type: SwitchProfileResponseDto,
  })
  @ApiResponse({ status: 403, description: "Not owner of this child" })
  @ApiResponse({ status: 404, description: "Child not found" })
  @Post("switch-profile")
  async switchProfile(
    @Req() req,
    @Body() dto: SwitchProfileDto,
  ): Promise<SwitchProfileResponseDto> {
    const parentId = req.user.sub; // Extract from JWT
    return this.authService.switchProfile(parentId, dto.childId);
  }

  /**
   * UC-00: Logout - Revoke token
   * Step 4: Token revoked, redirect to landing page
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Logout and invalidate session",
    description:
      "Revoke JWT token and end session. Client should redirect to landing page.",
  })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @Post("logout")
  async logout(@Req() req): Promise<{ message: string }> {
    const userId = req.user.sub;
    const token = req.headers.authorization?.split(" ")[1];
    return this.authService.logout(userId, token);
  }

  /**
   * Get current user info
   * No rate limit for frequent profile checks
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user info",
    description: "Returns authenticated user profile",
  })
  @ApiResponse({ status: 200, description: "User profile" })
  @SkipThrottle() // No rate limit
  @Get("me")
  async getCurrentUser(@Req() req) {
    const userId = req.user.sub;
    return this.authService.getCurrentUser(userId);
  }

  /**
   * OAuth Login - Google (Placeholder)
   * UC-00: Step 2 - OAuth provider redirect
   */
  @Public()
  @ApiOperation({
    summary: "Login with Google OAuth",
    description: "Redirect to Google OAuth consent screen",
  })
  @ApiResponse({ status: 200, description: "OAuth URL returned" })
  @Get("google")
  async loginWithGoogle() {
    // TODO: Generate Google OAuth URL
    return {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
    };
  }

  /**
   * OAuth Callback - Google (Placeholder)
   */
  @Public()
  @ApiOperation({
    summary: "Google OAuth callback",
    description: "Handle OAuth callback and issue JWT",
  })
  @Get("google/callback")
  async googleCallback() {
    // TODO: Exchange code for token, get user profile, issue JWT
    return { message: "OAuth not implemented yet" };
  }

  /**
   * OAuth Login - Facebook (Placeholder)
   */
  @Public()
  @ApiOperation({
    summary: "Login with Facebook OAuth",
    description: "Redirect to Facebook OAuth consent screen",
  })
  @Get("facebook")
  async loginWithFacebook() {
    return {
      authUrl: "https://www.facebook.com/v12.0/dialog/oauth?...",
    };
  }

  /**
   * OAuth Callback - Facebook (Placeholder)
   */
  @Public()
  @Get("facebook/callback")
  async facebookCallback() {
    return { message: "OAuth not implemented yet" };
  }
}
