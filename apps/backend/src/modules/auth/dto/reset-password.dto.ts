import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, Matches } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    description: "Reset token received from forgot-password response",
  })
  @IsString()
  token: string;

  @ApiProperty({
    example: "NewPass123!",
    description: "New password (min 8 chars, uppercase + lowercase + number)",
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and number",
  })
  newPassword: string;
}
