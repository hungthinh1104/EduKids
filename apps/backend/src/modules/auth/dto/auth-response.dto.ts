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
      id: "1",
      email: "parent@example.com",
      firstName: "John",
      lastName: "Doe",
    },
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export class SwitchProfileResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  learnerToken: string;

  @ApiProperty({
    example: {
      id: "2",
      nickname: "Anna",
      age: 8,
    },
  })
  child: {
    id: string;
    nickname: string;
    age: number;
  };
}
