import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBatchDto {
  @ApiProperty({ example: 'Batch A - Morning' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'Mon/Wed/Fri 9:00-10:00 AM' })
  @IsString()
  schedule: string;

  @ApiProperty({ example: 5000, minimum: 0 })
  @IsInt()
  @Min(0)
  feeAmount: number;

  @ApiPropertyOptional({ example: 'Advanced batch for grade 10 students' })
  @IsOptional()
  @IsString()
  description?: string;
}
