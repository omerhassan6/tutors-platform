import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'uuid-batch-id' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ example: 'Chapter 5 Exercises' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Complete all exercises from page 45 to 52' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-02-15T23:59:00Z' })
  @IsISO8601()
  dueDate: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/assignment.pdf' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;
}
