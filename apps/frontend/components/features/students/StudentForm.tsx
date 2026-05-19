import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Input } from '../../ui/Input'
import { Button } from '../../ui/Button'
import { apiGet } from '../../../lib/api'

// ─── Schema ───────────────────────────────────────────────────────────────────

const studentSchema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  email:       z.string().email('Invalid email address').optional().or(z.literal('')),
  phone:       z.string().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
  parentName:  z.string().min(2, 'Parent name is required').optional().or(z.literal('')),
  parentPhone: z.string().min(7, 'Enter a valid phone number').optional().or(z.literal('')),
  batchId:     z.string().optional(),
  note:        z.string().optional(),
})

export type StudentFormData = z.infer<typeof studentSchema>

interface Batch {
  id: string
  name: string
}

interface StudentFormProps {
  defaultValues?: Partial<StudentFormData>
  onSubmit: (data: StudentFormData) => Promise<void>
  submitLabel?: string
}

export function StudentForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save Student',
}: StudentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: defaultValues ?? {},
  })

  const { data: batches = [] } = useQuery<Batch[]>({
    queryKey: ['batches'],
    queryFn: () => apiGet<Batch[]>('/batches'),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input
        label="Student Name *"
        placeholder="e.g. Ali Hassan"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="student@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+92 300 0000000"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Parent Name"
          placeholder="e.g. Hassan Ali"
          error={errors.parentName?.message}
          {...register('parentName')}
        />
        <Input
          label="Parent Phone"
          type="tel"
          placeholder="+92 300 0000000"
          error={errors.parentPhone?.message}
          {...register('parentPhone')}
        />
      </div>

      {/* Batch select */}
      <div className="flex flex-col gap-1">
        <label htmlFor="batchId" className="text-sm font-medium text-gray-700">
          Batch
        </label>
        <select
          id="batchId"
          {...register('batchId')}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">Select a batch...</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="note" className="text-sm font-medium text-gray-700">
          Note
        </label>
        <textarea
          id="note"
          rows={3}
          placeholder="Any additional notes..."
          {...register('note')}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500 resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="submit" loading={isSubmitting} variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
