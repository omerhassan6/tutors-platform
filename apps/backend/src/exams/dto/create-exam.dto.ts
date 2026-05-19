import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsISO8601, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ExamType } from '../exams.types';

export class CreateExamDto {
  @ApiProperty({ example: 'uuid-batch-id' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ example: 'Mid-term Exam' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ExamType })
  @IsEnum(ExamType)
  examType: ExamType;

  @ApiProperty({ example: 100, minimum: 1 })
  @IsInt()
  @Min(1)
  totalMarks: number;

  @ApiProperty({ example: '2024-03-15T09:00:00Z' })
  @IsISO8601()
  scheduledAt: string;

  @ApiPropertyOptional({ type: [Object], description: 'Array of question objects' })
  @IsOptional()
  @IsArray()
  questions?: object[];
}
