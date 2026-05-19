import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateFeeDto {
  @ApiProperty({ example: 'uuid-student-id' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: 5000, minimum: 1 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ example: '2024-02-01' })
  @IsISO8601()
  dueDate: string;

  @ApiPropertyOptional({ example: 'Monthly tuition fee for January' })
  @IsOptional()
  @IsString()
  note?: string;
}
