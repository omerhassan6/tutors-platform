import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, ClipboardList, Calendar, Award } from 'lucide-react'
import { apiGet, apiPost, apiDelete } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToastContext } from '../../components/ui/Toast'

interface Exam {
  id: string
  batchId: string
  title: string
  examType: 'mcq' | 'written' | 'oral'
  totalMarks: number
  scheduledAt: string
}

const examSchema = z.object({
  batchId: z.string().uuid('Select a valid batch'),
  title: z.string().min(2, 'Title is required'),
  examType: z.enum(['mcq', 'written', 'oral']),
  totalMarks: z.coerce.number().min(1, 'Total marks must be at least 1'),
  scheduledAt: z.string().min(1, 'Date & time required'),
})

type ExamFormData = z.infer<typeof examSchema>

const typeVariant = { mcq: 'info', written: 'warning', oral: 'success' } as const
const typeLabel   = { mcq: 'MCQ', written: 'Written', oral: 'Oral' }

const ExamsPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: exams = [], isLoading, isError } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: () => apiGet<Exam[]>('/exams'),
    enabled: !authLoading && !!user,
  })

  const { data: batches = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['batches'],
    queryFn: () => apiGet('/batches'),
    enabled: !authLoading && !!user,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { examType: 'written', totalMarks: 100 },
  })

  const createMutation = useMutation({
    mutationFn: (data: ExamFormData) => apiPost<Exam>('/exams', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      setModalOpen(false)
      reset()
      addToast('Exam created', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to create exam', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/exams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exams'] })
      addToast('Exam deleted', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to delete exam', 'error'),
  })

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <>
      <Head><title>Exams — TutorHub</title></Head>
      <DashboardLayout>
        <div className="flex justify-end mb-6">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            New Exam
          </Button>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load exams. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No exams yet"
            description="Create your first exam to start tracking student performance."
            action={{ label: 'New Exam', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <Card key={exam.id}>
                <CardBody className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{exam.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(exam.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />{exam.totalMarks} marks</span>
                    </div>
                  </div>
                  <Badge variant={typeVariant[exam.examType]}>{typeLabel[exam.examType]}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(exam.id)}
                    loading={deleteMutation.isPending}
                    className="text-red-500 hover:bg-red-50 shrink-0"
                  >
                    Delete
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title="Create Exam" size="md">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="exam-title">Title</label>
              <input
                id="exam-title"
                {...register('title')}
                placeholder="e.g. Mid-Term Test"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="exam-batch">Batch</label>
              <select
                id="exam-batch"
                {...register('batchId')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select batch…</option>
                {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.batchId && <p className="text-xs text-red-600 mt-1">{errors.batchId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="exam-type">Type</label>
                <select
                  id="exam-type"
                  {...register('examType')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="written">Written</option>
                  <option value="mcq">MCQ</option>
                  <option value="oral">Oral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="exam-marks">Total Marks</label>
                <input
                  id="exam-marks"
                  type="number"
                  min={1}
                  {...register('totalMarks')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.totalMarks && <p className="text-xs text-red-600 mt-1">{errors.totalMarks.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="exam-at">Date & Time</label>
              <input
                id="exam-at"
                type="datetime-local"
                {...register('scheduledAt')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.scheduledAt && <p className="text-xs text-red-600 mt-1">{errors.scheduledAt.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>Create Exam</Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default ExamsPage
