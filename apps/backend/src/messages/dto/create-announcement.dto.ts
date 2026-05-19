import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsUUID } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Holiday Notice' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'There will be no classes on Friday due to a public holiday.' })
  @IsString()
  body: string;

  @ApiProperty({ example: ['uuid-batch-1', 'uuid-batch-2'], type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  targetBatches: string[];
}
