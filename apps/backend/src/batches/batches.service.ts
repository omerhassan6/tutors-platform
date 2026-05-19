import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('batches')
      .select('*')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('batches')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Batch with id ${id} not found`);
    return successResponse(data);
  }

  async create(tutorId: string, dto: CreateBatchDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('batches')
      .insert({
        tutor_id: tutorId,
        name: dto.name,
        subject: dto.subject,
        schedule: dto.schedule,
        fee_amount: dto.feeAmount,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async update(id: string, tutorId: string, dto: UpdateBatchDto): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.subject !== undefined) updatePayload.subject = dto.subject;
    if (dto.schedule !== undefined) updatePayload.schedule = dto.schedule;
    if (dto.feeAmount !== undefined) updatePayload.fee_amount = dto.feeAmount;
    if (dto.description !== undefined) updatePayload.description = dto.description;

    const { data, error } = await this.supabase.client
      .from('batches')
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
      .from('batches')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ deleted: true });
  }
}
