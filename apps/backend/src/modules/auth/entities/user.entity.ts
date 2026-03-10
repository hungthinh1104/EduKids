import { ApiProperty } from "@nestjs/swagger";

export class UserEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: "parent@example.com" })
  email: string;

  passwordHash: string; // Not exposed in API responses

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "PARENT", enum: ["PARENT", "ADMIN"] })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  lastLoginAt?: Date;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  createdAt: Date;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
  updatedAt: Date;
}
