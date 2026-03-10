import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class SwitchProfileDto {
  @ApiProperty({
    example: "2",
    description: "Child profile ID to switch to",
  })
  @IsString()
  @IsNotEmpty()
  childId: string;
}
