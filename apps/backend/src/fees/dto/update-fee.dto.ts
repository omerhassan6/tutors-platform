import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { CreateFeeDto } from './create-fee.dto';
import { FeeStatus } from '../fees.types';

export class UpdateFeeDto extends PartialType(CreateFeeDto) {
  @IsOptional()
  @IsISO8601()
  paidDate?: string;

  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;
}
