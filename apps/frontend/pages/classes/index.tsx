import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, School, Video, Clock, Calendar } from 'lucide-react'
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToastContext } from '../../components/ui/Toast'

interface ClassSession {
  id: string
  batchId: string
  title: string
  scheduledAt: string
  durationMinutes: number
  meetingUrl?: string
  platform?: 'zoom' | 'meet' | 'teams' | 'in_person'
}

const classSchema = z.object({
  batchId: z.string().uuid('Select a valid batch'),
  title: z.string().min(2, 'Title is required'),
  scheduledAt: z.string().min(1, 'Date & time required'),
  durationMinutes: z.coerce.number().min(15).max(480),
  meetingUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  platform: z.enum(['zoom', 'meet', 'teams', 'in_person']).optional(),
})

type ClassFormData = z.infer<typeof classSchema>

const platformLabel: Record<string, string> = {
  zoom: 'Zoom',
  meet: 'Google Meet',
  teams: 'MS Teams',
  in_person: 'In Person',
}

const ClassesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()
  const [modalOpen, setModalOpen] = useState(false)

  const { data: classes = [], isLoading, isError } = useQuery<ClassSession[]>({
    queryKey: ['classes'],
    queryFn: () => apiGet<ClassSession[]>('/classes'),
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
  } = useForm<ClassFormData>({ resolver: zodResolver(classSchema), defaultValues: { durationMinutes: 60 } })

  const createMutation = useMutation({
    mutationFn: (data: ClassFormData) => apiPost<ClassSession>('/classes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      setModalOpen(false)
      reset()
      addToast('Class scheduled', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to schedule class', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/classes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] })
      addToast('Class removed', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to remove class', 'error'),
  })

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const upcoming = classes.filter((c) => new Date(c.scheduledAt) >= new Date())
  const past = classes.filter((c) => new Date(c.scheduledAt) < new Date())

  return (
    <>
      <Head><title>Classes — TutorHub</title></Head>
      <DashboardLayout>
        <div className="flex justify-end mb-6">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Schedule Class
          </Button>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load classes. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : classes.length === 0 ? (
          <EmptyState
            icon={<School className="w-8 h-8" />}
            title="No classes scheduled"
            description="Schedule your first class to get started."
            action={{ label: 'Schedule Class', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map((cls) => (
                    <Card key={cls.id}>
                      <CardBody className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                          <School className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{cls.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(cls.scheduledAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.durationMinutes} min</span>
                            {cls.platform && <Badge variant="info">{platformLabel[cls.platform]}</Badge>}
                          </div>
                        </div>
                        {cls.meetingUrl && (
                          <a href={cls.meetingUrl} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium">
                            <Video className="w-4 h-4" /> Join
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(cls.id)}
                          loading={deleteMutation.isPending}
                          className="text-red-500 hover:bg-red-50 shrink-0"
                        >
                          Cancel
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Past</h2>
                <div className="space-y-3 opacity-60">
                  {past.map((cls) => (
                    <Card key={cls.id}>
                      <CardBody className="flex items-center gap-4 py-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                          <School className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-700 truncate">{cls.title}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(cls.scheduledAt)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.durationMinutes} min</span>
                          </div>
                        </div>
                        <Badge variant="default">Completed</Badge>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title="Schedule Class" size="md">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-title">Title</label>
              <input
                id="class-title"
                {...register('title')}
                placeholder="e.g. Math — Chapter 5 Review"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-batch">Batch</label>
              <select
                id="class-batch"
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
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-at">Date & Time</label>
                <input
                  id="class-at"
                  type="datetime-local"
                  {...register('scheduledAt')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.scheduledAt && <p className="text-xs text-red-600 mt-1">{errors.scheduledAt.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-duration">Duration (min)</label>
                <input
                  id="class-duration"
                  type="number"
                  min={15}
                  max={480}
                  {...register('durationMinutes')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
                {errors.durationMinutes && <p className="text-xs text-red-600 mt-1">{errors.durationMinutes.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-platform">Platform</label>
              <select
                id="class-platform"
                {...register('platform')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select platform (optional)</option>
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="teams">Microsoft Teams</option>
                <option value="in_person">In Person</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="class-url">Meeting URL (optional)</label>
              <input
                id="class-url"
                type="url"
                {...register('meetingUrl')}
                placeholder="https://zoom.us/j/..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.meetingUrl && <p className="text-xs text-red-600 mt-1">{errors.meetingUrl.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>Schedule</Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default ClassesPage
