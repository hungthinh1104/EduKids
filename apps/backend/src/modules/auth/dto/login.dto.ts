import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "parent@example.com",
    description: "User email address",
  })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @ApiProperty({
    example: "SecurePass123!",
    description: "User password",
  })
  @IsString()
  password: string;
}
