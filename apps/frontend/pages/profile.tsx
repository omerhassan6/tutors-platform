import React, { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Save } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import { useToastContext } from '../components/ui/Toast'
import { supabase } from '../lib/supabaseClient'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
})

type ProfileFormData = z.infer<typeof profileSchema>

const ProfilePage: NextPage = () => {
  const { user } = useAuth()
  const { addToast } = useToastContext()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
    },
  })

  async function onSubmit(data: ProfileFormData) {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: data.email !== user?.email ? data.email : undefined,
        data: { name: data.name },
      })
      if (error) throw error
      addToast('Profile updated', 'success')
    } catch (err: unknown) {
      addToast((err as { message?: string })?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Tutor'
  const initials = displayName.split(' ').slice(0, 2).map((s: string) => s[0]).join('').toUpperCase()

  return (
    <>
      <Head><title>Profile — TutorHub</title></Head>
      <DashboardLayout>
        <div className="max-w-lg">
          <Card className="mb-6">
            <CardBody className="flex items-center gap-5 py-6">
              <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-400 mt-1 capitalize">
                  Role: {user?.user_metadata?.role || 'tutor'}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="py-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Edit Profile
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Full Name"
                  id="profile-name"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="Your full name"
                />
                <div>
                  <Input
                    label="Email Address"
                    id="profile-email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    placeholder="you@example.com"
                    hint="Changing your email will require re-verification."
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" variant="primary" loading={saving} icon={<Save className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </DashboardLayout>
    </>
  )
}

export default ProfilePage
