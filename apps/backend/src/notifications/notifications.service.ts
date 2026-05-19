import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationChannel } from './notifications.types';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async send(senderId: string, dto: SendNotificationDto): Promise<ApiResponse<unknown>> {
    // Log notification to database
    const { data, error } = await this.supabase.client
      .from('notifications')
      .insert({
        sender_id: senderId,
        recipient_id: dto.recipientId,
        type: dto.type,
        message: dto.message,
        channel: dto.channel,
        read: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // Actual delivery is stubbed — integrate with provider based on channel
    switch (dto.channel) {
      case NotificationChannel.EMAIL:
        // TODO: Send email via SMTP (nodemailer) using SMTP_HOST, SMTP_USER, SMTP_PASS
        this.logger.log(`[STUB] Email notification sent to ${dto.recipientId}: ${dto.message}`);
        break;
      case NotificationChannel.SMS:
        // TODO: Send SMS via Twilio using TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE
        this.logger.log(`[STUB] SMS notification sent to ${dto.recipientId}: ${dto.message}`);
        break;
      case NotificationChannel.WHATSAPP:
        // TODO: Send WhatsApp message via API using WHATSAPP_API_KEY
        this.logger.log(`[STUB] WhatsApp notification sent to ${dto.recipientId}: ${dto.message}`);
        break;
      case NotificationChannel.IN_APP:
        // In-app notification already logged in DB above
        this.logger.log(`[IN_APP] Notification logged for ${dto.recipientId}: ${dto.message}`);
        break;
    }

    return successResponse(data);
  }

  async sendBulk(senderId: string, dtos: SendNotificationDto[]): Promise<ApiResponse<unknown[]>> {
    const results: unknown[] = [];
    for (const dto of dtos) {
      const result = await this.send(senderId, dto);
      results.push(result.data);
    }
    return successResponse(results);
  }

  async getNotifications(userId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async markRead(notificationId: string, userId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Notification with id ${notificationId} not found`);
    }
    return successResponse(data);
  }
}
