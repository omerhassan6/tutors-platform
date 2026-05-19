import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SubmitResultDto {
  @ApiProperty({ example: 'uuid-student-id' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'uuid-exam-id' })
  @IsUUID()
  examId: string;

  @ApiProperty({ example: 78, minimum: 0 })
  @IsInt()
  @Min(0)
  marks: number;

  @ApiPropertyOptional({ type: [Object], description: 'Array of student answer objects' })
  @IsOptional()
  @IsArray()
  answers?: object[];
}
