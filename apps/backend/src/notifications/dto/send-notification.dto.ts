import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { NotificationChannel, NotificationType } from '../notifications.types';

export class SendNotificationDto {
  @ApiProperty({ example: 'uuid-recipient-id' })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Your fee payment is due in 3 days.' })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;
}
