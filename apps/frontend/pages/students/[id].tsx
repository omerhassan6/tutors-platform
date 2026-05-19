import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Phone, Mail, User, Calendar, CreditCard, BookOpen, Pencil } from 'lucide-react'
import { apiGet, apiPatch } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { StudentForm, type StudentFormData } from '../../components/features/students/StudentForm'
import { useToastContext } from '../../components/ui/Toast'
import type { Student } from '../../components/features/students/StudentCard'
import type { FeeRecord } from '../../components/features/fees/FeeCard'

interface AttendanceSummary {
  date:   string
  status: 'present' | 'absent' | 'late'
}

interface AssignmentSubmission {
  id:           string
  title:        string
  submittedAt:  string
  grade?:       string
}

interface StudentDetail extends Student {
  attendanceLast30: AttendanceSummary[]
  fees:             FeeRecord[]
  submissions:      AssignmentSubmission[]
}

type TabId = 'overview' | 'attendance' | 'fees' | 'assignments'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',    label: 'Overview',    icon: <User className="w-4 h-4" /> },
  { id: 'attendance',  label: 'Attendance',  icon: <Calendar className="w-4 h-4" /> },
  { id: 'fees',        label: 'Fees',        icon: <CreditCard className="w-4 h-4" /> },
  { id: 'assignments', label: 'Assignments', icon: <BookOpen className="w-4 h-4" /> },
]

const StudentDetailPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const { addToast } = useToastContext()
  const { id } = router.query as { id: string }

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [editOpen, setEditOpen]   = useState(false)

  const { data: student, isLoading, isError } = useQuery<StudentDetail>({
    queryKey: ['students', id],
    queryFn:  () => apiGet<StudentDetail>(`/students/${id}`),
    enabled:  !authLoading && !!user && !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (data: StudentFormData) => apiPatch<Student>(`/students/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students', id] })
      setEditOpen(false)
      addToast('Student updated', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to update student', 'error')
    },
  })

  function AttendanceCalendar() {
    const records = student?.attendanceLast30 ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {records.map((r) => (
          <div
            key={r.date}
            title={`${r.date}: ${r.status}`}
            className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
              r.status === 'present' ? 'bg-green-100 text-green-700' :
              r.status === 'absent'  ? 'bg-red-100 text-red-700'    :
              'bg-yellow-100 text-yellow-700'
            }`}
          >
            {new Date(r.date).getDate()}
          </div>
        ))}
        {records.length === 0 && (
          <p className="text-sm text-gray-400">No attendance records in the last 30 days.</p>
        )}
      </div>
    )
  }

  function FeesTab() {
    const fees = student?.fees ?? []
    if (fees.length === 0) {
      return <p className="text-sm text-gray-400 py-4">No fee records found.</p>
    }
    return (
      <div className="divide-y divide-gray-100">
        {fees.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{f.description || 'Fee'}</p>
              <p className="text-xs text-gray-500">Due: {new Date(f.dueDate).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">
                {f.amount.toLocaleString()} {f.currency || 'PKR'}
              </span>
              <Badge variant={f.status === 'paid' ? 'success' : f.status === 'overdue' ? 'danger' : 'warning'}>
                {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function AssignmentsTab() {
    const subs = student?.submissions ?? []
    if (subs.length === 0) {
      return <p className="text-sm text-gray-400 py-4">No assignment submissions.</p>
    }
    return (
      <div className="divide-y divide-gray-100">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-500">
                Submitted: {new Date(s.submittedAt).toLocaleDateString()}
              </p>
            </div>
            {s.grade && (
              <Badge variant="info">Grade: {s.grade}</Badge>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{student?.name ?? 'Student'} — TutorHub</title>
      </Head>

      <DashboardLayout>
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </button>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
            Failed to load student details.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Profile header */}
            <Card>
              <CardBody>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold shrink-0">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
                      {student.batchName && (
                        <p className="text-sm text-gray-500">{student.batchName}</p>
                      )}
                      <div className="mt-1">
                        <Badge variant={student.status === 'active' ? 'success' : student.status === 'inactive' ? 'default' : 'warning'}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    icon={<Pencil className="w-4 h-4" />}
                    onClick={() => setEditOpen(true)}
                  >
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
                  {student.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {student.email}
                    </div>
                  )}
                  {student.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {student.phone}
                    </div>
                  )}
                  {student.parentName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {student.parentName}
                      {student.parentPhone && ` · ${student.parentPhone}`}
                    </div>
                  )}
                </div>

                {student.note && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">Note</p>
                    <p className="text-sm text-gray-700">{student.note}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <div className="flex gap-1 overflow-x-auto">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardBody>
                {activeTab === 'overview' && (
                  <div className="text-sm text-gray-600">
                    <p className="text-base font-semibold text-gray-900 mb-1">{student.name}</p>
                    <p>Enrolled in <strong>{student.batchName || 'No batch'}</strong>.</p>
                    {student.note && <p className="mt-2 text-gray-500 italic">{student.note}</p>}
                  </div>
                )}
                {activeTab === 'attendance' && <AttendanceCalendar />}
                {activeTab === 'fees'        && <FeesTab />}
                {activeTab === 'assignments' && <AssignmentsTab />}
              </CardBody>
            </Card>
          </div>
        ) : null}

        {/* Edit modal */}
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Student" size="md">
          {student && (
            <StudentForm
              defaultValues={student}
              onSubmit={async (data) => { await updateMutation.mutateAsync(data) }}
              submitLabel="Save Changes"
            />
          )}
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default StudentDetailPage
