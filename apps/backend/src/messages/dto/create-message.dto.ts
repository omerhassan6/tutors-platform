import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'uuid-recipient-id' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ example: 'Please complete your homework by tomorrow.', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content: string;
}
