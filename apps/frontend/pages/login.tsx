import React, { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, LogIn } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

const LoginPage: NextPage = () => {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // If already logged in redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [router])

  async function onSubmit(data: LoginFormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email:    data.email,
      password: data.password,
    })

    if (error) {
      setError('root', {
        message: error.message || 'Invalid credentials. Please try again.',
      })
      return
    }

    router.replace('/dashboard')
  }

  return (
    <>
      <Head>
        <title>Sign in — TutorHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-elevated p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mb-4 shadow-soft">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to your TutorHub account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Root / server error */}
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
                icon={<LogIn className="w-4 h-4" />}
                className="w-full mt-1"
              >
                Sign in
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoginPage
