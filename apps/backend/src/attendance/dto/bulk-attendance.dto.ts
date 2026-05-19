import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateAttendanceDto } from './create-attendance.dto';

export class BulkAttendanceDto {
  @ApiProperty({ type: [CreateAttendanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttendanceDto)
  records: CreateAttendanceDto[];
}
