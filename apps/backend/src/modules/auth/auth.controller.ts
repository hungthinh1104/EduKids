import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotImplementedException,
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
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import {
  ProfileActionResultDto,
  SwitchChildProfileDto,
} from "../child-profile/child-profile.dto";

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
  @Throttle(20, 60) // 20 refresh attempts per 60 seconds
  @Post("refresh")
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  /**
   * UC-00: Switch to child profile
   * Step 3: Role-based redirect to Learning Dashboard
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Switch to child profile",
    description:
      "Parent switches to child profile. Returns the same token/profile contract as POST /api/profiles/switch.",
  })
  @ApiResponse({
    status: 200,
    description: "Switched to child profile",
    type: ProfileActionResultDto,
  })
  @ApiResponse({ status: 403, description: "Not owner of this child" })
  @ApiResponse({ status: 404, description: "Child not found" })
  @Post("switch-profile")
  async switchProfile(
    @Req() req,
    @Body() dto: SwitchChildProfileDto,
  ): Promise<ProfileActionResultDto> {
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
   * Exit learner mode and return to parent/admin session
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Exit child mode",
    description:
      "Issue a new token with the account's original role (PARENT/ADMIN) so user can leave child learning area.",
  })
  @ApiResponse({
    status: 200,
    description: "Exited child mode successfully",
    type: AuthResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post("exit-child")
  async exitChildMode(@Req() req): Promise<AuthResponseDto> {
    const userId = req.user.sub;
    return this.authService.exitChildMode(userId);
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
   * UC-00: Forgot password — request reset link
   */
  @Public()
  @ApiOperation({
    summary: "Request password reset link",
    description:
      "Send reset link to registered email. In non-production environments, the raw token is also returned for local testing.",
  })
  @ApiResponse({
    status: 200,
    description: "Reset link sent (if email registered)",
  })
  @Throttle(3, 60) // 3 requests per minute per IP
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * UC-00: Reset password with token
   */
  @Public()
  @ApiOperation({
    summary: "Reset password using reset token",
    description: "Validates token (15-min TTL) and sets a new password.",
  })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @Throttle(5, 60) // 5 reset attempts per 60 seconds
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  /**
   * UC-00: Change password (authenticated)
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Change password",
    description: "Verify current password and set a new one.",
  })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  @HttpCode(HttpStatus.OK)
  @Post("change-password")
  async changePassword(
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.sub, dto);
  }

  /**
   * UC-00: Update current user profile (firstName / lastName)
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update profile",
    description: "Update the current user's first/last name.",
  })
  @ApiResponse({ status: 200, description: "Profile updated successfully" })
  @HttpCode(HttpStatus.OK)
  @Patch("profile")
  async updateProfile(
    @Req() req,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    return this.authService.updateProfile(req.user.sub, dto);
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
  @ApiResponse({ status: 501, description: "OAuth flow not available" })
  @Get("google")
  async loginWithGoogle() {
    throw new NotImplementedException("Google OAuth is disabled");
  }

  /**
   * OAuth Callback - Google (Placeholder)
   */
  @Public()
  @ApiOperation({
    summary: "Google OAuth callback",
    description: "Handle OAuth callback and issue JWT",
  })
  @ApiResponse({ status: 501, description: "OAuth flow not available" })
  @Get("google/callback")
  async googleCallback() {
    throw new NotImplementedException("Google OAuth is disabled");
  }

  /**
   * OAuth Login - Facebook (Placeholder)
   */
  @Public()
  @ApiOperation({
    summary: "Login with Facebook OAuth",
    description: "Redirect to Facebook OAuth consent screen",
  })
  @ApiResponse({ status: 501, description: "OAuth flow not available" })
  @Get("facebook")
  async loginWithFacebook() {
    throw new NotImplementedException("Facebook OAuth is disabled");
  }

  /**
   * OAuth Callback - Facebook (Placeholder)
   */
  @Public()
  @ApiResponse({ status: 501, description: "OAuth flow not available" })
  @Get("facebook/callback")
  async facebookCallback() {
    throw new NotImplementedException("Facebook OAuth is disabled");
  }
}
