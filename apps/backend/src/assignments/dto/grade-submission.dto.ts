import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class GradeSubmissionDto {
  @ApiProperty({ example: 'Good work, but review question 3' })
  @IsString()
  feedback: string;

  @ApiProperty({ example: 85, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  grade: number;
}
