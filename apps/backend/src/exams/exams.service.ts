import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateExamDto } from './dto/create-exam.dto';
import { SubmitResultDto } from './dto/submit-result.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(tutorId: string, dto: CreateExamDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('exams')
      .insert({
        tutor_id: tutorId,
        batch_id: dto.batchId,
        title: dto.title,
        exam_type: dto.examType,
        total_marks: dto.totalMarks,
        scheduled_at: dto.scheduledAt,
        questions: dto.questions ?? [],
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async findAll(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('exams')
      .select('*')
      .eq('tutor_id', tutorId)
      .order('scheduled_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .single();

    if (error || !data) throw new NotFoundException(`Exam with id ${id} not found`);
    return successResponse(data);
  }

  async submitResult(tutorId: string, dto: SubmitResultDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('exam_results')
      .insert({
        tutor_id: tutorId,
        exam_id: dto.examId,
        student_id: dto.studentId,
        marks: dto.marks,
        answers: dto.answers ?? [],
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async getResults(examId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('exam_results')
      .select('*, students(name, email)')
      .eq('exam_id', examId)
      .order('marks', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async getStudentResults(studentId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('exam_results')
      .select('*, exams(title, total_marks, exam_type, scheduled_at)')
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }
}
