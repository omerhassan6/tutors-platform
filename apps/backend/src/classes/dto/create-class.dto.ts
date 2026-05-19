import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, Min } from 'class-validator';

export enum MeetingPlatform {
  ZOOM = 'zoom',
  MEET = 'meet',
  TEAMS = 'teams',
}

export class CreateClassDto {
  @ApiProperty({ example: 'uuid-batch-id' })
  @IsUUID()
  batchId: string;

  @ApiProperty({ example: 'Chapter 6: Quadratic Equations' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2024-02-15T09:00:00Z' })
  @IsISO8601()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/123456789' })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiPropertyOptional({ enum: MeetingPlatform })
  @IsOptional()
  @IsEnum(MeetingPlatform)
  platform?: MeetingPlatform;

  @ApiProperty({ example: 60, minimum: 15, maximum: 480 })
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes: number;
}
