import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly supabase: SupabaseService) {}

  async sendMessage(senderId: string, dto: CreateMessageDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('messages')
      .insert({
        sender_id: senderId,
        recipient_id: dto.recipientId,
        content: dto.content,
        read: false,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async getConversation(user1: string, user2: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user1},recipient_id.eq.${user2}),and(sender_id.eq.${user2},recipient_id.eq.${user1})`,
      )
      .order('sent_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async markRead(messageId: string, userId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Message with id ${messageId} not found`);
    return successResponse(data);
  }

  async createAnnouncement(tutorId: string, dto: CreateAnnouncementDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('announcements')
      .insert({
        tutor_id: tutorId,
        title: dto.title,
        body: dto.body,
        target_batches: dto.targetBatches,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async getAnnouncements(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('announcements')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }
}
