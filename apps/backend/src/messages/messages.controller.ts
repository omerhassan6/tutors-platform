import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a direct message' })
  sendMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.messagesService.sendMessage(user.sub, dto);
  }

  @Get('conversation/:userId')
  @ApiOperation({ summary: 'Get conversation between current user and another user' })
  getConversation(
    @CurrentUser() user: any,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.messagesService.getConversation(user.sub, userId);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create an announcement for one or more batches' })
  createAnnouncement(@CurrentUser() user: any, @Body() dto: CreateAnnouncementDto) {
    return this.messagesService.createAnnouncement(user.sub, dto);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List all announcements for the authenticated tutor' })
  getAnnouncements(@CurrentUser() user: any) {
    return this.messagesService.getAnnouncements(user.sub);
  }
}
