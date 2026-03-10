import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "parent@example.com",
    description: "Parent email address",
  })
  @IsEmail({}, { message: "Invalid email format" })
  email: string;

  @ApiProperty({
    example: "SecurePass123!",
    description:
      "Password (min 8 chars, must include uppercase, lowercase, number)",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain uppercase, lowercase, and number",
  })
  password: string;

  @ApiProperty({ example: "John", description: "First name" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: "Doe", description: "Last name" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
