import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: "parent@example.com", description: "Registered email address" })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;
}
