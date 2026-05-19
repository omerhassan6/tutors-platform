import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { GraduationCap, Home, ArrowLeft } from 'lucide-react'

const NotFoundPage: NextPage = () => {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>404 — Page not found · TutorHub</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-soft">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 404 number */}
          <p className="text-8xl font-extrabold text-primary-200 leading-none mb-4">404</p>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 text-sm mb-8">
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFoundPage
