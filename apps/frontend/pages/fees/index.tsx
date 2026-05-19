import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusCircle, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { apiGet, apiPost, apiPatch } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { FeeCard, type FeeRecord, type FeeStatus } from '../../components/features/fees/FeeCard'
import { useToastContext } from '../../components/ui/Toast'

// ─── Types & schema ───────────────────────────────────────────────────────────

interface FeeSummary {
  totalPending:  number
  totalCollected: number
  overdueCount:  number
  currency:      string
}

const feeSchema = z.object({
  studentId:   z.string().min(1, 'Select a student'),
  amount:      z.coerce.number().positive('Amount must be positive'),
  dueDate:     z.string().min(1, 'Select a due date'),
  description: z.string().optional(),
})

type FeeFormData = z.infer<typeof feeSchema>

interface Student { id: string; name: string }

type TabId = 'all' | 'pending' | 'overdue' | 'paid'

// ─── Stat card ────────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon, color, loading,
}: {
  label: string; value: string; icon: React.ReactNode; color: string; loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      {loading ? (
        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-20" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">{label}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FeesPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()
  const qc = useQueryClient()
  const { addToast } = useToastContext()

  const [addOpen, setAddOpen]       = useState(false)
  const [activeTab, setActiveTab]   = useState<TabId>('all')
  const [markingId, setMarkingId]   = useState<string | null>(null)

  const { data: summary, isLoading: summaryLoading } = useQuery<FeeSummary>({
    queryKey: ['fees-summary'],
    queryFn:  () => apiGet<FeeSummary>('/fees/summary'),
    enabled:  !authLoading && !!user,
  })

  const { data: fees = [], isLoading: feesLoading } = useQuery<FeeRecord[]>({
    queryKey: ['fees'],
    queryFn:  () => apiGet<FeeRecord[]>('/fees'),
    enabled:  !authLoading && !!user,
  })

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students-slim'],
    queryFn:  () => apiGet<Student[]>('/students?slim=true'),
    enabled:  !authLoading && !!user,
  })

  const createMutation = useMutation({
    mutationFn: (data: FeeFormData) => apiPost<FeeRecord>('/fees', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['fees-summary'] })
      setAddOpen(false)
      addToast('Fee record added', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to add fee', 'error')
    },
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiPatch<FeeRecord>(`/fees/${id}/paid`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['fees-summary'] })
      setMarkingId(null)
      addToast('Fee marked as paid', 'success')
    },
    onError: (err: { message?: string }) => {
      addToast(err?.message || 'Failed to mark fee as paid', 'error')
      setMarkingId(null)
    },
  })

  async function handleMarkPaid(id: string) {
    setMarkingId(id)
    await markPaidMutation.mutateAsync(id)
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'all',     label: 'All'     },
    { id: 'pending', label: 'Pending' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'paid',    label: 'Paid'    },
  ]

  const filtered =
    activeTab === 'all' ? fees : fees.filter((f) => f.status === activeTab)

  const fmt = (n: number) => n?.toLocaleString() ?? '0'
  const currency = summary?.currency ?? 'PKR'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeeFormData>({ resolver: zodResolver(feeSchema) })

  return (
    <>
      <Head><title>Fees — TutorHub</title></Head>

      <DashboardLayout>
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          <SummaryCard
            label="Total Pending"
            value={`${fmt(summary?.totalPending ?? 0)} ${currency}`}
            icon={<Clock className="w-4 h-4 text-yellow-600" />}
            color="bg-yellow-50"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Total Collected"
            value={`${fmt(summary?.totalCollected ?? 0)} ${currency}`}
            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            color="bg-green-50"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Overdue"
            value={String(summary?.overdueCount ?? 0)}
            icon={<AlertCircle className="w-4 h-4 text-red-600" />}
            color="bg-red-50"
            loading={summaryLoading}
          />
        </div>

        {/* Tabs + Add button */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => { reset(); setAddOpen(true) }}
          >
            Add Fee Record
          </Button>
        </div>

        {/* Grid */}
        {feesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title={`No ${activeTab === 'all' ? '' : activeTab + ' '}fee records`}
            description="Fee records will appear here once added."
            action={activeTab === 'all' ? { label: 'Add Fee Record', onClick: () => setAddOpen(true) } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((fee) => (
              <FeeCard
                key={fee.id}
                fee={fee}
                onMarkPaid={handleMarkPaid}
                isMarkingPaid={markingId === fee.id && markPaidMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Add modal */}
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Fee Record" size="md">
          <form
            onSubmit={handleSubmit(async (data) => { await createMutation.mutateAsync(data) })}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="studentId" className="text-sm font-medium text-gray-700">Student *</label>
              <select
                id="studentId"
                {...register('studentId')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="">Select student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.studentId && <p className="text-xs text-red-600">{errors.studentId.message}</p>}
            </div>

            <Input
              label="Amount *"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 5000"
              error={errors.amount?.message}
              {...register('amount')}
            />

            <Input
              label="Due Date *"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />

            <Input
              label="Description"
              placeholder="e.g. Monthly tuition fee"
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Add Record
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </>
  )
}

export default FeesPage
