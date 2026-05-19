import React from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  CalendarCheck,
  CreditCard,
  School,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { apiGet } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalStudents:      number
  attendanceRateToday: number
  pendingFees:        number
  upcomingClassCount: number
}

interface UpcomingClass {
  id:        string
  name:      string
  batchName: string
  startTime: string
  endTime:   string
}

interface DashboardData {
  stats:          DashboardStats
  upcomingClasses: UpcomingClass[]
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string
  value:   string | number
  icon:    React.ReactNode
  color:   string
  loading: boolean
}

function StatCard({ label, value, icon, color, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
              {icon}
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DashboardPage: NextPage = () => {
  const { user, loading: authLoading } = useAuth()

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey:  ['dashboard'],
    queryFn:   () => apiGet<DashboardData>('/analytics/dashboard'),
    enabled:   !authLoading && !!user,
    staleTime: 60_000,
  })

  const stats = data?.stats
  const upcomingClasses = data?.upcomingClasses ?? []

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'

  return (
    <>
      <Head>
        <title>Dashboard — TutorHub</title>
      </Head>

      <DashboardLayout>
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Good {getGreeting()}, {displayName} 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-sm text-red-700">
            Failed to load dashboard data. Please refresh the page.
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            label="Total Students"
            value={stats?.totalStudents ?? 0}
            icon={<Users className="w-5 h-5 text-blue-600" />}
            color="bg-blue-50"
            loading={isLoading}
          />
          <StatCard
            label="Today's Attendance"
            value={stats ? `${stats.attendanceRateToday}%` : '0%'}
            icon={<CalendarCheck className="w-5 h-5 text-green-600" />}
            color="bg-green-50"
            loading={isLoading}
          />
          <StatCard
            label="Pending Fees"
            value={stats?.pendingFees ?? 0}
            icon={<CreditCard className="w-5 h-5 text-yellow-600" />}
            color="bg-yellow-50"
            loading={isLoading}
          />
          <StatCard
            label="Upcoming Classes"
            value={stats?.upcomingClassCount ?? 0}
            icon={<School className="w-5 h-5 text-purple-600" />}
            color="bg-purple-50"
            loading={isLoading}
          />
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming classes */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Upcoming Classes</h3>
              <Link href="/classes" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                ))
              ) : upcomingClasses.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-400">
                  No upcoming classes scheduled.
                </div>
              ) : (
                upcomingClasses.map((cls) => (
                  <div key={cls.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                      <p className="text-xs text-gray-500">{cls.batchName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {cls.startTime} – {cls.endTime}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {[
                { label: 'Add a student',    href: '/students',    icon: <Users className="w-4 h-4" /> },
                { label: 'Mark attendance',  href: '/attendance',  icon: <CalendarCheck className="w-4 h-4" /> },
                { label: 'Record a fee',     href: '/fees',        icon: <CreditCard className="w-4 h-4" /> },
                { label: 'New assignment',   href: '/assignments', icon: <TrendingUp className="w-4 h-4" /> },
              ].map((a) => (
                <Button
                  key={a.href}
                  variant="secondary"
                  size="sm"
                  icon={a.icon}
                  onClick={() => window.location.href = a.href}
                  className="justify-start"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export default DashboardPage
