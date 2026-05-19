import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceStatus } from '../attendance.types';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'uuid-student-id' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '2024-01-15' })
  @IsISO8601()
  classDate: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ example: 'Student came 5 minutes late' })
  @IsOptional()
  @IsString()
  note?: string;
}
