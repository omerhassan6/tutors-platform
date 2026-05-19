import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly supabase: SupabaseService) {}

  async markAttendance(tutorId: string, dto: CreateAttendanceDto): Promise<ApiResponse<unknown>> {
    // Check for existing attendance
    const { data: existing } = await this.supabase.client
      .from('attendance')
      .select('id')
      .eq('student_id', dto.studentId)
      .eq('class_date', dto.classDate)
      .maybeSingle();

    if (existing) {
      throw new ConflictException(
        `Attendance already marked for student ${dto.studentId} on ${dto.classDate}`,
      );
    }

    const { data, error } = await this.supabase.client
      .from('attendance')
      .insert({
        tutor_id: tutorId,
        student_id: dto.studentId,
        class_date: dto.classDate,
        status: dto.status,
        note: dto.note,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async markBulkAttendance(tutorId: string, dto: BulkAttendanceDto): Promise<ApiResponse<unknown[]>> {
    const results: unknown[] = [];

    for (const record of dto.records) {
      const { data: existing } = await this.supabase.client
        .from('attendance')
        .select('id')
        .eq('student_id', record.studentId)
        .eq('class_date', record.classDate)
        .maybeSingle();

      if (existing) {
        // Skip duplicates in bulk — update instead
        const { data: updated, error } = await this.supabase.client
          .from('attendance')
          .update({ status: record.status, note: record.note })
          .eq('student_id', record.studentId)
          .eq('class_date', record.classDate)
          .select()
          .single();

        if (!error && updated) results.push(updated);
      } else {
        const { data: inserted, error } = await this.supabase.client
          .from('attendance')
          .insert({
            tutor_id: tutorId,
            student_id: record.studentId,
            class_date: record.classDate,
            status: record.status,
            note: record.note,
          })
          .select()
          .single();

        if (!error && inserted) results.push(inserted);
      }
    }

    return successResponse(results);
  }

  async findByStudent(tutorId: string, query: QueryAttendanceDto): Promise<ApiResponse<unknown[]>> {
    let dbQuery = this.supabase.client
      .from('attendance')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('class_date', { ascending: false });

    if (query.studentId) dbQuery = dbQuery.eq('student_id', query.studentId);
    if (query.startDate) dbQuery = dbQuery.gte('class_date', query.startDate);
    if (query.endDate) dbQuery = dbQuery.lte('class_date', query.endDate);

    const { data, error } = await dbQuery;
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findByBatch(tutorId: string, query: QueryAttendanceDto): Promise<ApiResponse<unknown[]>> {
    let dbQuery = this.supabase.client
      .from('attendance')
      .select('*, students!inner(batch_id)')
      .eq('tutor_id', tutorId)
      .order('class_date', { ascending: false });

    if (query.batchId) dbQuery = dbQuery.eq('students.batch_id', query.batchId);
    if (query.startDate) dbQuery = dbQuery.gte('class_date', query.startDate);
    if (query.endDate) dbQuery = dbQuery.lte('class_date', query.endDate);

    const { data, error } = await dbQuery;
    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async getMonthlyReport(
    studentId: string,
    month: number,
    year: number,
  ): Promise<ApiResponse<unknown>> {
    const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

    const { data, error } = await this.supabase.client
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .gte('class_date', startDate)
      .lte('class_date', endDate);

    if (error) throw new InternalServerErrorException(error.message);

    const records = data ?? [];
    const total = records.length;
    const presentCount = records.filter((r: any) => r.status === 'present').length;
    const absentCount = records.filter((r: any) => r.status === 'absent').length;
    const lateCount = records.filter((r: any) => r.status === 'late').length;
    const excusedCount = records.filter((r: any) => r.status === 'excused').length;
    const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return successResponse({
      studentId,
      month,
      year,
      total,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      excused: excusedCount,
      attendanceRate,
      records,
    });
  }
}
