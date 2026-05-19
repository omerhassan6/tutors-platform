import React from 'react'
import { useRouter } from 'next/router'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/cn'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/students':    'Students',
  '/attendance':  'Attendance',
  '/fees':        'Fees',
  '/assignments': 'Assignments',
  '/messages':    'Messages',
  '/classes':     'Classes',
  '/exams':       'Exams',
  '/resources':   'Resources',
}

function getTitle(pathname: string): string {
  // Exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  // Prefix match for dynamic routes like /students/[id]
  for (const [key, value] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + '/')) return value
  }
  return 'TutorHub'
}

export function TopNav() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Tutor'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((s: string) => s[0])
    .join('')
    .toUpperCase()

  const title = getTitle(router.pathname)

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 z-20 bg-white border-b border-gray-200 h-16 flex items-center px-6 gap-4">
      {/* Page title */}
      <div className="flex-1 md:ml-0 ml-12">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200',
                'hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-52 bg-white rounded-xl border border-gray-200 shadow-elevated py-1.5 animate-fade-in"
            >
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 outline-none"
                onSelect={() => router.push('/profile')}
              >
                <User className="w-4 h-4 text-gray-400" />
                Profile
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 outline-none"
                onSelect={() => router.push('/settings')}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

              <DropdownMenu.Item
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 outline-none"
                onSelect={signOut}
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
