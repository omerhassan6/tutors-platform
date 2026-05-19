import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Ali Khan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ali@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Khan Senior' })
  @IsString()
  parentName: string;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { message: 'parentPhone must be a valid E.164 phone number' })
  parentPhone: string;

  @ApiProperty({ example: 'uuid-batch-id' })
  @IsUUID()
  batchId: string;

  @ApiPropertyOptional({ example: 'Student is very dedicated' })
  @IsOptional()
  @IsString()
  note?: string;
}
