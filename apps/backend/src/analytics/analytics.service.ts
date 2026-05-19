import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ApiResponse, successResponse } from '../common/types/api-response.type';

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getDashboardStats(tutorId: string): Promise<ApiResponse<unknown>> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayDate = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [studentsRes, attendanceRes, pendingFeesRes, upcomingClassesRes, revenueRes] =
      await Promise.all([
        this.supabase.client
          .from('students')
          .select('id, status')
          .eq('tutor_id', tutorId)
          .is('deleted_at', null),
        this.supabase.client
          .from('attendance')
          .select('status')
          .eq('tutor_id', tutorId)
          .eq('class_date', todayDate),
        this.supabase.client
          .from('fees')
          .select('amount')
          .eq('tutor_id', tutorId)
          .in('status', ['pending', 'overdue']),
        this.supabase.client
          .from('classes')
          .select('id')
          .eq('tutor_id', tutorId)
          .gte('scheduled_at', todayStart)
          .is('deleted_at', null),
        this.supabase.client
          .from('fees')
          .select('amount')
          .eq('tutor_id', tutorId)
          .eq('status', 'paid')
          .gte('paid_date', monthStart.slice(0, 10)),
      ]);

    const students = studentsRes.data ?? [];
    const totalStudents = students.length;
    const activeStudents = students.filter((s: any) => s.status === 'active').length;

    const todayAttendance = attendanceRes.data ?? [];
    const presentToday = todayAttendance.filter((a: any) => a.status === 'present').length;
    const todayAttendanceRate =
      todayAttendance.length > 0
        ? Math.round((presentToday / todayAttendance.length) * 100)
        : 0;

    const pendingFees = (pendingFeesRes.data ?? []).reduce(
      (acc: number, f: any) => acc + (f.amount ?? 0),
      0,
    );
    const upcomingClasses = upcomingClassesRes.data?.length ?? 0;
    const monthlyRevenue = (revenueRes.data ?? []).reduce(
      (acc: number, f: any) => acc + (f.amount ?? 0),
      0,
    );

    return successResponse({
      totalStudents,
      activeStudents,
      todayAttendanceRate,
      pendingFees,
      upcomingClasses,
      monthlyRevenue,
    });
  }

  async getStudentProgress(studentId: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const [attendanceRes, submissionsRes, examsRes] = await Promise.all([
      this.supabase.client
        .from('attendance')
        .select('status')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId),
      this.supabase.client
        .from('assignment_submissions')
        .select('grade')
        .eq('student_id', studentId)
        .eq('tutor_id', tutorId),
      this.supabase.client
        .from('exam_results')
        .select('marks, total_marks, exam_id, exams(title)')
        .eq('student_id', studentId),
    ]);

    const attendance = attendanceRes.data ?? [];
    const total = attendance.length;
    const present = attendance.filter((a: any) => a.status === 'present').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    const submissions = submissionsRes.data ?? [];
    const gradedSubmissions = submissions.filter((s: any) => s.grade != null);
    const averageGrade =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((acc: number, s: any) => acc + s.grade, 0) /
              gradedSubmissions.length,
          )
        : 0;

    return successResponse({
      attendanceRate,
      averageGrade,
      assignmentsSubmitted: submissions.length,
      examResults: examsRes.data ?? [],
    });
  }

  async getBatchPerformance(batchId: string, tutorId: string): Promise<ApiResponse<unknown>> {
    const [studentsRes, attendanceRes, gradesRes] = await Promise.all([
      this.supabase.client
        .from('students')
        .select('id, name')
        .eq('batch_id', batchId)
        .eq('tutor_id', tutorId)
        .is('deleted_at', null),
      this.supabase.client
        .from('attendance')
        .select('student_id, status')
        .eq('tutor_id', tutorId),
      this.supabase.client
        .from('assignment_submissions')
        .select('student_id, grade')
        .eq('tutor_id', tutorId)
        .not('grade', 'is', null),
    ]);

    const students = studentsRes.data ?? [];
    const attendance = attendanceRes.data ?? [];
    const grades = gradesRes.data ?? [];

    const studentIds = students.map((s: any) => s.id);

    const batchAttendance = attendance.filter((a: any) => studentIds.includes(a.student_id));
    const batchPresent = batchAttendance.filter((a: any) => a.status === 'present').length;
    const averageAttendance =
      batchAttendance.length > 0
        ? Math.round((batchPresent / batchAttendance.length) * 100)
        : 0;

    const batchGrades = grades.filter((g: any) => studentIds.includes(g.student_id));
    const averageGrade =
      batchGrades.length > 0
        ? Math.round(
            batchGrades.reduce((acc: number, g: any) => acc + (g.grade ?? 0), 0) /
              batchGrades.length,
          )
        : 0;

    // Top students by average grade
    const studentGradeMap: Record<string, number[]> = {};
    for (const g of batchGrades) {
      if (!studentGradeMap[g.student_id]) studentGradeMap[g.student_id] = [];
      studentGradeMap[g.student_id].push(g.grade);
    }

    const topStudents = students
      .map((s: any) => {
        const sGrades = studentGradeMap[s.id] ?? [];
        const avg =
          sGrades.length > 0
            ? Math.round(sGrades.reduce((a: number, b: number) => a + b, 0) / sGrades.length)
            : 0;
        return { id: s.id, name: s.name, averageGrade: avg };
      })
      .sort((a: any, b: any) => b.averageGrade - a.averageGrade)
      .slice(0, 5);

    return successResponse({ averageAttendance, averageGrade, topStudents });
  }

  async getRevenueAnalytics(tutorId: string): Promise<ApiResponse<unknown>> {
    const { data, error } = await this.supabase.client
      .from('fees')
      .select('amount, status, paid_date, due_date')
      .eq('tutor_id', tutorId);

    if (error) throw new InternalServerErrorException(error.message);

    const fees = data ?? [];
    const totalCollected = fees
      .filter((f: any) => f.status === 'paid')
      .reduce((acc: number, f: any) => acc + (f.amount ?? 0), 0);
    const pending = fees
      .filter((f: any) => f.status === 'pending' || f.status === 'overdue')
      .reduce((acc: number, f: any) => acc + (f.amount ?? 0), 0);

    // Group paid fees by month
    const monthlyMap: Record<string, number> = {};
    for (const f of fees.filter((f: any) => f.status === 'paid' && f.paid_date)) {
      const month = (f.paid_date as string).slice(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] ?? 0) + (f.amount ?? 0);
    }
    const monthlyData = Object.entries(monthlyMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return successResponse({ monthlyData, totalCollected, pending });
  }
}
