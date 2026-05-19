import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { FeeStatus } from '../fees.types';

export class QueryFeeDto {
  @ApiPropertyOptional({ enum: FeeStatus })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({ description: 'Filter by student UUID' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsISO8601()
  toDate?: string;
}
