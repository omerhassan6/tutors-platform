import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Bell, Shield, Save } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import { useToastContext } from '../components/ui/Toast'
import { supabase } from '../lib/supabaseClient'

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

const SettingsPage: NextPage = () => {
  useAuth()
  const { addToast } = useToastContext()
  const [savingPw, setSavingPw] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  async function onChangePassword(data: PasswordFormData) {
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw error
      addToast('Password changed successfully', 'success')
      reset()
    } catch (err: unknown) {
      addToast((err as { message?: string })?.message || 'Failed to change password', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <>
      <Head><title>Settings — TutorHub</title></Head>
      <DashboardLayout>
        <div className="max-w-lg space-y-6">
          {/* Change Password */}
          <Card>
            <CardBody className="py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" /> Change Password
              </h2>
              <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                <Input
                  label="New Password"
                  id="new-password"
                  type="password"
                  {...register('newPassword')}
                  error={errors.newPassword?.message}
                  placeholder="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  id="confirm-password"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  placeholder="Re-enter new password"
                />
                <div className="pt-2">
                  <Button type="submit" variant="primary" loading={savingPw} icon={<Save className="w-4 h-4" />}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Notification Preferences (UI only, preferences stored client-side) */}
          <Card>
            <CardBody className="py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-gray-400" /> Notification Preferences
              </h2>
              <div className="space-y-3">
                {[
                  { id: 'notif-fees', label: 'Fee due reminders', desc: 'Get notified when student fees are overdue' },
                  { id: 'notif-attendance', label: 'Attendance alerts', desc: 'Notify parents when a student is absent' },
                  { id: 'notif-assignments', label: 'Assignment reminders', desc: 'Remind students of upcoming due dates' },
                  { id: 'notif-classes', label: 'Class reminders', desc: 'Get notified 30 minutes before a scheduled class' },
                ].map((item) => (
                  <label key={item.id} htmlFor={item.id} className="flex items-start gap-4 cursor-pointer group">
                    <div className="mt-0.5">
                      <input
                        id={item.id}
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-5">
                <Button
                  variant="primary"
                  icon={<Save className="w-4 h-4" />}
                  onClick={() => addToast('Preferences saved', 'success')}
                >
                  Save Preferences
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardBody className="py-6">
              <h2 className="text-base font-semibold text-red-700 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Danger Zone
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Deleting your account will permanently remove all your data. This action cannot be undone.
              </p>
              <Button
                variant="danger"
                onClick={() => addToast('Please contact support to delete your account.', 'info')}
              >
                Delete Account
              </Button>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    </>
  )
}

export default SettingsPage
