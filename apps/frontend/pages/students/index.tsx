import React, { useState, useMemo } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Search, Users, Trash2 } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { StudentCard, type Student } from '../../components/features/students/StudentCard'
import { StudentCardSkeleton } from '../../components/features/students/StudentCardSkeleton'
import { StudentForm, type StudentFormData } from '../../components/features/students/StudentForm'
import { useToastContext } from '../../components/ui/Toast'

const StudentsPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const { addToast } = useToastContext()

  const [search, setSearch]     = useState('')
  const [addOpen, setAddOpen]   = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: students = [], isLoading, isError } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn:  () => apiGet<Student[]>('/students'),
    enabled:  !authLoading && !!user,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.batchName?.toLowerCase().includes(q)
    )
  }, [students, search])

  const createMutation = useMutation({
    mutationFn: (data: StudentFormData) => apiPost<Student>('/students', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setAddOpen(false)
      addToast('Student added successfully', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to add student', 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentFormData }) =>
      apiPatch<Student>(`/students/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setEditStudent(null)
      addToast('Student updated', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to update student', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/students/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      setDeleteId(null)
      addToast('Student deleted', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to delete student', 'error')
    },
  })

  return (
    <>
      <Head>
        <title>Students — TutorHub</title>
      </Head>

      <DashboardLayout>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <Button
            variant="primary"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setAddOpen(true)}
          >
            Add Student
          </Button>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load students. Please refresh.
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <StudentCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search ? 'No students match your search' : 'No students yet'}
            description={search ? 'Try a different search term.' : 'Add your first student to get started.'}
            action={!search ? { label: 'Add Student', onClick: () => setAddOpen(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onView={(s) => router.push(`/students/${s.id}`)}
                onEdit={(s) => setEditStudent(s)}
                onDelete={(s) => setDeleteId(s.id)}
              />
            ))}
          </div>
        )}

        {/* Add modal */}
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Student" size="md">
          <StudentForm
            onSubmit={async (data) => { await createMutation.mutateAsync(data) }}
            submitLabel="Add Student"
          />
        </Modal>

        {/* Edit modal */}
        <Modal
          open={!!editStudent}
          onClose={() => setEditStudent(null)}
          title="Edit Student"
          size="md"
        >
          {editStudent && (
            <StudentForm
              defaultValues={editStudent}
              onSubmit={async (data) => {
                await updateMutation.mutateAsync({ id: editStudent.id, data })
              }}
              submitLabel="Save Changes"
            />
          )}
        </Modal>

        {/* Delete confirmation */}
        <Modal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Delete Student"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-5">
            Are you sure you want to delete this student? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteMutation.isPending}
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </Button>
          </div>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default StudentsPage
