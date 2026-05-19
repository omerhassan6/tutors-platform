import React, { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { apiPost } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

// ─── Schema ───────────────────────────────────────────────────────────────────

const signupSchema = z
  .object({
    name:            z.string().min(2, 'Name must be at least 2 characters'),
    email:           z.string().email('Enter a valid email address'),
    password:        z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

const SignupPage: NextPage = () => {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  async function onSubmit(data: SignupFormData) {
    try {
      // Register via NestJS backend (creates user + profile)
      await apiPost('/auth/signup', {
        name:     data.name,
        email:    data.email,
        password: data.password,
      })

      // Sign in with Supabase to get a session
      const { error } = await supabase.auth.signInWithPassword({
        email:    data.email,
        password: data.password,
      })

      if (error) {
        setError('root', { message: error.message })
        return
      }

      router.replace('/dashboard')
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      setError('root', {
        message: apiError?.message || 'Signup failed. Please try again.',
      })
    }
  }

  return (
    <>
      <Head>
        <title>Create account — TutorHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-elevated p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-soft">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-sm text-gray-500 mt-1">Join TutorHub and manage your students</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Full name"
                placeholder="e.g. Sarah Khan"
                autoComplete="name"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                error={errors.password?.message}
                hint="At least 8 characters"
                {...register('password')}
              />

              <Input
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              {errors.root && (
                <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                icon={<UserPlus className="w-4 h-4" />}
                className="w-full mt-1"
              >
                Create account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default SignupPage
