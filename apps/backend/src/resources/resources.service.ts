import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(tutorId: string, dto: CreateResourceDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('resources')
      .insert({
        tutor_id: tutorId,
        batch_id: dto.batchId,
        title: dto.title,
        type: dto.type,
        file_url: dto.fileUrl,
        link_url: dto.linkUrl,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async findAll(tutorId: string, query: QueryResourceDto): Promise<ApiResponse<unknown[]>> {
    let dbQuery = this.supabase.client
      .from('resources')
      .select('*')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (query.type) dbQuery = dbQuery.eq('type', query.type);
    if (query.batchId) dbQuery = dbQuery.eq('batch_id', query.batchId);

    const { data, error } = await dbQuery;
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('resources')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Resource with id ${id} not found`);
    return successResponse(data);
  }

  async update(id: string, tutorId: string, dto: UpdateResourceDto): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.batchId !== undefined) updatePayload.batch_id = dto.batchId;
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.type !== undefined) updatePayload.type = dto.type;
    if (dto.fileUrl !== undefined) updatePayload.file_url = dto.fileUrl;
    if (dto.linkUrl !== undefined) updatePayload.link_url = dto.linkUrl;
    if (dto.description !== undefined) updatePayload.description = dto.description;

    const { data, error } = await this.supabase.client
      .from('resources')
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
      .from('resources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ deleted: true });
  }
}
