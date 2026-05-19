import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateSubmissionDto {
  @ApiProperty({ example: 'uuid-assignment-id' })
  @IsUUID()
  assignmentId: string;

  @ApiProperty({ example: 'uuid-student-id' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 'https://storage.example.com/submission.pdf' })
  @IsUrl()
  fileUrl: string;

  @ApiPropertyOptional({ example: 'I completed all parts except 5c' })
  @IsOptional()
  @IsString()
  note?: string;
}
