import React from 'react'
import { Check, X, Clock } from 'lucide-react'
import { Badge, type BadgeVariant } from '../../ui/Badge'
import { cn } from '../../../lib/cn'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked'

export interface AttendanceStudent {
  id: string
  name: string
  batchName?: string
  status: AttendanceStatus
}

interface AttendanceRowProps {
  student: AttendanceStudent
  onMark: (studentId: string, status: AttendanceStatus) => void
}

const statusVariant: Record<AttendanceStatus, BadgeVariant> = {
  present:  'success',
  absent:   'danger',
  late:     'warning',
  unmarked: 'default',
}

const statusLabel: Record<AttendanceStatus, string> = {
  present:  'Present',
  absent:   'Absent',
  late:     'Late',
  unmarked: 'Unmarked',
}

interface ActionButtonProps {
  active: boolean
  color: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function ActionButton({ active, color, icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        active
          ? `${color} ring-1`
          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

export function AttendanceRow({ student, onMark }: AttendanceRowProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Student info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {student.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{student.name}</p>
            {student.batchName && (
              <p className="text-xs text-gray-500">{student.batchName}</p>
            )}
          </div>
        </div>
      </td>

      {/* Current status */}
      <td className="px-4 py-3">
        <Badge variant={statusVariant[student.status]}>
          {statusLabel[student.status]}
        </Badge>
      </td>

      {/* Action buttons */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <ActionButton
            active={student.status === 'present'}
            color="bg-green-50 text-green-700 border-green-300 ring-green-300"
            icon={<Check className="w-3.5 h-3.5" />}
            label="Present"
            onClick={() => onMark(student.id, 'present')}
          />
          <ActionButton
            active={student.status === 'absent'}
            color="bg-red-50 text-red-700 border-red-300 ring-red-300"
            icon={<X className="w-3.5 h-3.5" />}
            label="Absent"
            onClick={() => onMark(student.id, 'absent')}
          />
          <ActionButton
            active={student.status === 'late'}
            color="bg-yellow-50 text-yellow-700 border-yellow-300 ring-yellow-300"
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Late"
            onClick={() => onMark(student.id, 'late')}
          />
        </div>
      </td>
    </tr>
  )
}
