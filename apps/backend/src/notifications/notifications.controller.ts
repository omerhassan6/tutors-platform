import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification to a recipient' })
  send(@CurrentUser() user: any, @Body() dto: SendNotificationDto) {
    return this.notificationsService.send(user.sub, dto);
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Send notifications to multiple recipients' })
  sendBulk(@CurrentUser() user: any, @Body() dtos: SendNotificationDto[]) {
    return this.notificationsService.sendBulk(user.sub, dtos);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  getMyNotifications(@CurrentUser() user: any) {
    return this.notificationsService.getNotifications(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(id, user.sub);
  }
}
