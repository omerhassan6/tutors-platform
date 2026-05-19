import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, FolderOpen, FileText, Video, Link2, Image, BookOpen, ExternalLink, Trash2 } from 'lucide-react'
import { apiGet, apiPost, apiDelete } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToastContext } from '../../components/ui/Toast'

type ResourceType = 'pdf' | 'video' | 'image' | 'link' | 'note'

interface Resource {
  id: string
  title: string
  type: ResourceType
  fileUrl?: string
  linkUrl?: string
  description?: string
  batchId?: string
  createdAt: string
}

const resourceSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  type: z.enum(['pdf', 'video', 'image', 'link', 'note']),
  batchId: z.string().uuid().optional().or(z.literal('')),
  fileUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
})

type ResourceFormData = z.infer<typeof resourceSchema>

const typeIcon: Record<ResourceType, React.ReactNode> = {
  pdf:   <FileText className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  link:  <Link2 className="w-5 h-5" />,
  note:  <BookOpen className="w-5 h-5" />,
}

const typeVariant: Record<ResourceType, BadgeVariant> = {
  pdf:   'danger',
  video: 'info',
  image: 'success',
  link:  'warning',
  note:  'default',
}

const ResourcesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()
  const [modalOpen, setModalOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all')

  const { data: resources = [], isLoading, isError } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => apiGet<Resource[]>('/resources'),
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
  } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { type: 'pdf' },
  })

  const createMutation = useMutation({
    mutationFn: (data: ResourceFormData) => apiPost<Resource>('/resources', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      setModalOpen(false)
      reset()
      addToast('Resource added', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to add resource', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/resources/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resources'] })
      addToast('Resource deleted', 'success')
    },
    onError: (err: { message?: string }) => addToast(err?.message || 'Failed to delete resource', 'error'),
  })

  const filtered = typeFilter === 'all' ? resources : resources.filter((r) => r.type === typeFilter)

  const filterTypes: { label: string; value: ResourceType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'PDFs', value: 'pdf' },
    { label: 'Videos', value: 'video' },
    { label: 'Links', value: 'link' },
    { label: 'Notes', value: 'note' },
    { label: 'Images', value: 'image' },
  ]

  return (
    <>
      <Head><title>Resources — TutorHub</title></Head>
      <DashboardLayout>
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {filterTypes.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === f.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
            Add Resource
          </Button>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load resources. Please refresh.
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8" />}
            title="No resources yet"
            description="Upload notes, PDFs, videos, and links for your students."
            action={{ label: 'Add Resource', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((res) => (
              <Card key={res.id} className="group">
                <CardBody className="flex flex-col gap-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                        {typeIcon[res.type]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{res.title}</p>
                        {res.description && (
                          <p className="text-xs text-gray-500 truncate">{res.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={typeVariant[res.type]}>{res.type.toUpperCase()}</Badge>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    {(res.fileUrl || res.linkUrl) ? (
                      <a
                        href={res.fileUrl || res.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open
                      </a>
                    ) : (
                      <span />
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(res.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 p-1 rounded"
                      aria-label="Delete resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title="Add Resource" size="md">
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="res-title">Title</label>
              <input
                id="res-title"
                {...register('title')}
                placeholder="e.g. Chapter 3 Notes"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="res-type">Type</label>
                <select
                  id="res-type"
                  {...register('type')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                  <option value="note">Note</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="res-batch">Batch (optional)</label>
                <select
                  id="res-batch"
                  {...register('batchId')}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All students</option>
                  {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="res-url">File / Link URL</label>
              <input
                id="res-url"
                type="url"
                {...register('linkUrl')}
                placeholder="https://..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.linkUrl && <p className="text-xs text-red-600 mt-1">{errors.linkUrl.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="res-desc">Description (optional)</label>
              <textarea
                id="res-desc"
                {...register('description')}
                rows={2}
                placeholder="Brief description..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset() }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>Add Resource</Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default ResourcesPage
