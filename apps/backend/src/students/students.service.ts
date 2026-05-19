import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { Student } from './students.types';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(tutorId: string, query: QueryStudentDto): Promise<ApiResponse<Student[]>> {
    let dbQuery = this.supabase.client
      .from('students')
      .select('id, name, email, phone, parent_name, parent_phone, batch_id, status, note, enrolled_at, created_at')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(query.limit ?? 20);

    if (query.status) dbQuery = dbQuery.eq('status', query.status);
    if (query.batchId) dbQuery = dbQuery.eq('batch_id', query.batchId);

    const { data, error, count } = await dbQuery;
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data as Student[], count != null ? { total: count } : undefined);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<Student>> {
    const { data, error } = await this.supabase.client
      .from('students')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Student with id ${id} not found`);
    return successResponse(data as Student);
  }

  async create(tutorId: string, dto: CreateStudentDto): Promise<ApiResponse<Student>> {
    const { data, error } = await this.supabase.client
      .from('students')
      .insert({
        tutor_id: tutorId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        parent_name: dto.parentName,
        parent_phone: dto.parentPhone,
        batch_id: dto.batchId,
        note: dto.note,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data as Student);
  }

  async update(id: string, tutorId: string, dto: UpdateStudentDto): Promise<ApiResponse<Student>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.email !== undefined) updatePayload.email = dto.email;
    if (dto.phone !== undefined) updatePayload.phone = dto.phone;
    if (dto.parentName !== undefined) updatePayload.parent_name = dto.parentName;
    if (dto.parentPhone !== undefined) updatePayload.parent_phone = dto.parentPhone;
    if (dto.batchId !== undefined) updatePayload.batch_id = dto.batchId;
    if (dto.note !== undefined) updatePayload.note = dto.note;

    const { data, error } = await this.supabase.client
      .from('students')
      .update(updatePayload)
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data as Student);
  }

  async remove(id: string, tutorId: string): Promise<ApiResponse<{ deleted: boolean }>> {
    await this.findOne(id, tutorId);

    const { error } = await this.supabase.client
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ deleted: true });
  }
}
