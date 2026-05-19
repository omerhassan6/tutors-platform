import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ResourceType } from '../resources.types';

export class QueryResourceDto {
  @ApiPropertyOptional({ enum: ResourceType })
  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @ApiPropertyOptional({ description: 'Filter by batch UUID' })
  @IsOptional()
  @IsUUID()
  batchId?: string;
}
