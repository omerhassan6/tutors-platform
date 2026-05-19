import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(tutorId: string, dto: CreateAssignmentDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('assignments')
      .insert({
        tutor_id: tutorId,
        batch_id: dto.batchId,
        title: dto.title,
        description: dto.description,
        due_date: dto.dueDate,
        file_url: dto.fileUrl,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async findAll(tutorId: string): Promise<ApiResponse<unknown[]>> {
    const { data, error } = await this.supabase.client
      .from('assignments')
      .select('*')
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data ?? []);
  }

  async findOne(id: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('assignments')
      .select('*')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new NotFoundException(`Assignment with id ${id} not found`);
    return successResponse(data);
  }

  async update(id: string, tutorId: string, dto: UpdateAssignmentDto): Promise<ApiResponse<unknown>> {
    await this.findOne(id, tutorId);

    const updatePayload: Record<string, unknown> = {};
    if (dto.batchId !== undefined) updatePayload.batch_id = dto.batchId;
    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.dueDate !== undefined) updatePayload.due_date = dto.dueDate;
    if (dto.fileUrl !== undefined) updatePayload.file_url = dto.fileUrl;

    const { data, error } = await this.supabase.client
      .from('assignments')
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
      .from('assignments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse({ deleted: true });
  }

  async createSubmission(tutorId: string, dto: CreateSubmissionDto): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('assignment_submissions')
      .insert({
        tutor_id: tutorId,
        assignment_id: dto.assignmentId,
        student_id: dto.studentId,
        file_url: dto.fileUrl,
        note: dto.note,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return successResponse(data);
  }

  async gradeSubmission(
    submissionId: string,
    tutorId: string,
    dto: GradeSubmissionDto,
  ): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('assignment_submissions')
      .update({
        feedback: dto.feedback,
        grade: dto.grade,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .eq('tutor_id', tutorId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Submission with id ${submissionId} not found`);
    return successResponse(data);
  }
}
