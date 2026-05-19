import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, BookOpen, Calendar, Users2, ChevronRight } from 'lucide-react'
import { apiGet, apiPost } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToastContext } from '../../components/ui/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  id:              string
  title:           string
  description?:    string
  batchId:         string
  batchName:       string
  dueDate:         string
  submissionCount: number
  totalStudents:   number
  createdAt:       string
}

interface Batch { id: string; name: string }

const assignmentSchema = z.object({
  title:       z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  batchId:     z.string().min(1, 'Select a batch'),
  dueDate:     z.string().min(1, 'Due date is required'),
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

const AssignmentsPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()

  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: assignments = [], isLoading, isError } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn:  () => apiGet<Assignment[]>('/assignments'),
    enabled:  !authLoading && !!user,
  })

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['batches'],
    queryFn:  () => apiGet<Batch[]>('/batches'),
    enabled:  !authLoading && !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => apiPost<Assignment>('/assignments', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] })
      setAddOpen(false)
      reset()
      addToast('Assignment created', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to create assignment', 'error')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormData>({ resolver: zodResolver(assignmentSchema) })

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date()
  }

  return (
    <>
      <Head><title>Assignments — TutorHub</title></Head>

      <DashboardLayout>
        <div className="flex items-center justify-between mb-6">
          <div />
          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => { reset(); setAddOpen(true) }}
          >
            New Assignment
          </Button>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load assignments.
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No assignments yet"
            description="Create your first assignment for a batch."
            action={{ label: 'New Assignment', onClick: () => setAddOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {assignments.map((a) => (
              <Card key={a.id} className="p-5 flex flex-col gap-3 cursor-pointer hover:shadow-elevated transition-shadow" onClick={() => setSelectedId(a.id)}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 leading-snug">{a.title}</h3>
                  <Badge variant={isOverdue(a.dueDate) ? 'danger' : 'info'}>
                    {isOverdue(a.dueDate) ? 'Overdue' : 'Active'}
                  </Badge>
                </div>

                {a.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{a.description}</p>
                )}

                <div className="flex flex-col gap-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5" />
                    {a.batchName}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(a.dueDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {a.submissionCount}/{a.totalStudents} submitted
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add modal */}
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Assignment" size="md">
          <form
            onSubmit={handleSubmit(async (data) => { await createMutation.mutateAsync(data) })}
            className="flex flex-col gap-4"
            noValidate
          >
            <Input
              label="Title *"
              placeholder="e.g. Chapter 5 Exercises"
              error={errors.title?.message}
              {...register('title')}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="assign-desc" className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="assign-desc"
                rows={3}
                placeholder="Assignment details..."
                {...register('description')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="assign-batch" className="text-sm font-medium text-gray-700">Batch *</label>
              <select
                id="assign-batch"
                {...register('batchId')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select batch...</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              {errors.batchId && <p className="text-xs text-red-600">{errors.batchId.message}</p>}
            </div>

            <Input
              label="Due Date *"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>Create Assignment</Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default AssignmentsPage
