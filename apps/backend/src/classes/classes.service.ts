import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(tutorId: string, dto: CreateClassDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('classes')
      .insert({
        tutor_id: tutorId,
        batch_id: dto.batchId,
        title: dto.title,
        scheduled_at: dto.scheduledAt,
        meeting_url: dto.meetingUrl,
        platform: dto.platform,
        duration_minutes: dto.durationMinutes,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async findAll(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('*')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('classes')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Class with id ${id} not found`);
    return successResponse(data);
  }

  async update(id: string, tutorId: string, dto: UpdateClassDto): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.batchId !== undefined) updatePayload.batch_id = dto.batchId;
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.scheduledAt !== undefined) updatePayload.scheduled_at = dto.scheduledAt;
    if (dto.meetingUrl !== undefined) updatePayload.meeting_url = dto.meetingUrl;
    if (dto.platform !== undefined) updatePayload.platform = dto.platform;
    if (dto.durationMinutes !== undefined) updatePayload.duration_minutes = dto.durationMinutes;

    const { data, error } = await this.supabase.client
      .from('classes')
      .update(updatePayload)
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async remove(id: string, tutorId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.findOne(id, tutorId);

    const { error } = await this.supabase.client
      .from('classes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ deleted: true });
  }

  async getUpcoming(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase.client
      .from('classes')
      .select('*')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }
}
