import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { ResourceType } from '../resources.types';

export class CreateResourceDto {
  @ApiPropertyOptional({ example: 'uuid-batch-id', description: 'Optional batch association' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ example: 'Chapter 5 Notes' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ResourceType })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiPropertyOptional({ example: 'https://storage.example.com/notes.pdf' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=abc123' })
  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Summary of quadratic equations chapter' })
  @IsOptional()
  @IsString()
  description?: string;
}
