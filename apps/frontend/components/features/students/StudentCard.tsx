import React from 'react'
import { motion } from 'framer-motion'
import { Phone, Eye, Pencil, Trash2, User } from 'lucide-react'
import { Badge, type BadgeVariant } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

export interface Student {
  id: string
  name: string
  email?: string
  phone?: string
  parentName?: string
  parentPhone?: string
  batchId?: string
  batchName?: string
  status: 'active' | 'inactive' | 'pending'
  note?: string
  createdAt?: string
}

interface StudentCardProps {
  student: Student
  onView?: (student: Student) => void
  onEdit?: (student: Student) => void
  onDelete?: (student: Student) => void
}

const statusVariant: Record<Student['status'], BadgeVariant> = {
  active:   'success',
  inactive: 'default',
  pending:  'warning',
}

export function StudentCard({ student, onView, onEdit, onDelete }: StudentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.15 }}
    >
      <Card className="p-5 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{student.name}</p>
              {student.batchName && (
                <p className="text-xs text-gray-500 truncate">{student.batchName}</p>
              )}
            </div>
          </div>
          <Badge variant={statusVariant[student.status]}>
            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
          </Badge>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1.5 text-sm text-gray-600">
          {student.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{student.phone}</span>
            </div>
          )}
          {student.parentName && (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {student.parentName}
                {student.parentPhone && (
                  <span className="text-gray-400"> · {student.parentPhone}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye className="w-4 h-4" />}
            onClick={() => onView?.(student)}
            className="flex-1"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Pencil className="w-4 h-4" />}
            onClick={() => onEdit?.(student)}
            className="flex-1"
          >
            Edit
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="w-4 h-4 text-red-400" />}
              onClick={() => onDelete(student)}
              aria-label={`Delete ${student.name}`}
              className="text-red-500 hover:bg-red-50"
            />
          )}
        </div>
      </Card>
    </motion.div>
  )
}
