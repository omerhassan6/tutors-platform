import React from 'react'
import { Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card } from '../../ui/Card'
import { Badge, type BadgeVariant } from '../../ui/Badge'
import { Button } from '../../ui/Button'

export type FeeStatus = 'pending' | 'paid' | 'overdue'

export interface FeeRecord {
  id: string
  studentId: string
  studentName: string
  amount: number
  currency?: string
  dueDate: string
  paidDate?: string
  status: FeeStatus
  description?: string
}

interface FeeCardProps {
  fee: FeeRecord
  onMarkPaid?: (feeId: string) => void
  isMarkingPaid?: boolean
}

const statusVariant: Record<FeeStatus, BadgeVariant> = {
  pending: 'warning',
  paid:    'success',
  overdue: 'danger',
}

const statusLabel: Record<FeeStatus, string> = {
  pending: 'Pending',
  paid:    'Paid',
  overdue: 'Overdue',
}

const statusIcon: Record<FeeStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  paid:    <CheckCircle className="w-4 h-4 text-green-500" />,
  overdue: <AlertCircle className="w-4 h-4 text-red-500" />,
}

function formatCurrency(amount: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function FeeCard({ fee, onMarkPaid, isMarkingPaid = false }: FeeCardProps) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {statusIcon[fee.status]}
          <div>
            <p className="font-semibold text-gray-900 text-sm">{fee.studentName}</p>
            {fee.description && (
              <p className="text-xs text-gray-500">{fee.description}</p>
            )}
          </div>
        </div>
        <Badge variant={statusVariant[fee.status]}>{statusLabel[fee.status]}</Badge>
      </div>

      {/* Amount */}
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(fee.amount, fee.currency)}
        </p>
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Due: {formatDate(fee.dueDate)}</span>
        </div>
        {fee.paidDate && (
          <div className="flex items-center gap-1.5 text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Paid: {formatDate(fee.paidDate)}</span>
          </div>
        )}
      </div>

      {/* Mark paid button — only for pending/overdue */}
      {fee.status !== 'paid' && onMarkPaid && (
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="primary"
            size="sm"
            loading={isMarkingPaid}
            onClick={() => onMarkPaid(fee.id)}
            className="w-full"
          >
            Mark as Paid
          </Button>
        </div>
      )}
    </Card>
  )
}
