import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CalendarCheck, CheckSquare, Send } from 'lucide-react'
import { apiGet, apiPost } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  AttendanceRow,
  type AttendanceStudent,
  type AttendanceStatus,
} from '../../components/features/attendance/AttendanceRow'
import { useToastContext } from '../../components/ui/Toast'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const AttendancePage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToastContext()

  const [date, setDate]       = useState(todayISO())
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})

  const { data: students = [], isLoading, isError } = useQuery<AttendanceStudent[]>({
    queryKey: ['attendance-students', date],
    queryFn:  () => apiGet<AttendanceStudent[]>(`/attendance/students?date=${date}`),
    enabled:  !authLoading && !!user,
  })

  // Pre-populate records when students data loads / date changes
  React.useEffect(() => {
    if (!students || students.length === 0) return
    const init: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { init[s.id] = s.status })
    setRecords(init)
  }, [students])

  const submitMutation = useMutation({
    mutationFn: (payload: { date: string; records: Record<string, AttendanceStatus> }) =>
      apiPost('/attendance/bulk', payload),
    onSuccess: () => {
      addToast('Attendance saved successfully', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to save attendance', 'error')
    },
  })

  function markStudent(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { next[s.id] = status })
    setRecords(next)
  }

  function handleSubmit() {
    submitMutation.mutate({ date, records })
  }

  const markedCount = Object.values(records).filter((s) => s !== 'unmarked').length
  const totalCount  = students.length

  const displayStudents: AttendanceStudent[] = students.map((s) => ({
    ...s,
    status: records[s.id] ?? s.status,
  }))

  return (
    <>
      <Head>
        <title>Attendance — TutorHub</title>
      </Head>

      <DashboardLayout>
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700">
              Date:
            </label>
            <input
              id="attendance-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {markedCount}/{totalCount} marked
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckSquare className="w-4 h-4" />}
              onClick={() => markAll('present')}
              disabled={isLoading}
            >
              Mark All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              loading={submitMutation.isPending}
              onClick={handleSubmit}
              disabled={isLoading || totalCount === 0}
            >
              Save Attendance
            </Button>
          </div>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load students. Please refresh.
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Mark</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-48 rounded-lg" /></td>
                  </tr>
                ))
              ) : displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10">
                    <EmptyState
                      icon={<CalendarCheck className="w-7 h-7" />}
                      title="No students found"
                      description="There are no students to mark attendance for."
                    />
                  </td>
                </tr>
              ) : (
                displayStudents.map((student) => (
                  <AttendanceRow
                    key={student.id}
                    student={student}
                    onMark={markStudent}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </>
  )
}

export default AttendancePage
