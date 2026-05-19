import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateFeeDto } from './dto/create-fee.dto';
import { UpdateFeeDto } from './dto/update-fee.dto';
import { QueryFeeDto } from './dto/query-fee.dto';

@Injectable()
export class FeesService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(tutorId: string, query: QueryFeeDto): Promise<ApiResponse<unknown[]>> {
    let dbQuery = this.supabase.client
      .from('fees')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('due_date', { ascending: false });

    if (query.status) dbQuery = dbQuery.eq('status', query.status);
    if (query.studentId) dbQuery = dbQuery.eq('student_id', query.studentId);
    if (query.fromDate) dbQuery = dbQuery.gte('due_date', query.fromDate);
    if (query.toDate) dbQuery = dbQuery.lte('due_date', query.toDate);

    const { data, error } = await dbQuery;
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('fees')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .single();

    if (error || !data) throw new NotFoundException(`Fee with id ${id} not found`);
    return successResponse(data);
  }

  async create(tutorId: string, dto: CreateFeeDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('fees')
      .insert({
        tutor_id: tutorId,
        student_id: dto.studentId,
        amount: dto.amount,
        due_date: dto.dueDate,
        note: dto.note,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async update(id: string, tutorId: string, dto: UpdateFeeDto): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.amount !== undefined) updatePayload.amount = dto.amount;
    if (dto.dueDate !== undefined) updatePayload.due_date = dto.dueDate;
    if (dto.note !== undefined) updatePayload.note = dto.note;
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.paidDate !== undefined) updatePayload.paid_date = dto.paidDate;

    const { data, error } = await this.supabase.client
      .from('fees')
      .update(updatePayload)
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async markPaid(id: string, tutorId: string, paidDate?: string): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const { data, error } = await this.supabase.client
      .from('fees')
      .update({
        status: 'paid',
        paid_date: paidDate ?? new Date().toISOString().slice(0, 10),
      })
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async calculateOverdue(tutorId: string): Promise<ApiResponse<{ updated: number }>> {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await this.supabase.client
      .from('fees')
      .update({ status: 'overdue' })
      .eq('tutor_id', tutorId)
      .eq('status', 'pending')
      .lt('due_date', today)
      .select();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ updated: data?.length ?? 0 });
  }

  async getSummary(tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('fees')
      .select('amount, status')
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);

    const records = data ?? [];
    const totalPending = records
      .filter((r: any) => r.status === 'pending' || r.status === 'overdue')
      .reduce((acc: number, r: any) => acc + (r.amount ?? 0), 0);
    const totalPaid = records
      .filter((r: any) => r.status === 'paid')
      .reduce((acc: number, r: any) => acc + (r.amount ?? 0), 0);
    const overdueCount = records.filter((r: any) => r.status === 'overdue').length;

    return successResponse({ totalPending, totalPaid, overdueCount });
  }
}
