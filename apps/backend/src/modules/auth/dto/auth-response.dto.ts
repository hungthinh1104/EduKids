import { ApiProperty } from "@nestjs/swagger";

export class AuthResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  refreshToken: string;

  @ApiProperty({ example: "PARENT" })
  role: string;

  @ApiProperty({
    example: {
      id: 1,
      email: "parent@example.com",
      firstName: "John",
      lastName: "Doe",
      isActive: true,
      isEmailVerified: false,
      createdAt: "2026-03-21T00:00:00.000Z",
    },
  })
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    createdAt?: Date;
  };
}
