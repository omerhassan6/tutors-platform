import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  BookOpen,
  MessageSquare,
  School,
  ClipboardList,
  FolderOpen,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/useAuth'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard',   href: '/dashboard',   icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Students',    href: '/students',    icon: <Users className="w-5 h-5" /> },
  { label: 'Attendance',  href: '/attendance',  icon: <CalendarCheck className="w-5 h-5" /> },
  { label: 'Fees',        href: '/fees',        icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Assignments', href: '/assignments', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'Messages',    href: '/messages',    icon: <MessageSquare className="w-5 h-5" /> },
  { label: 'Classes',     href: '/classes',     icon: <School className="w-5 h-5" /> },
  { label: 'Exams',       href: '/exams',       icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'Resources',   href: '/resources',   icon: <FolderOpen className="w-5 h-5" /> },
]

export function Sidebar() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Tutor'
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((s: string) => s[0])
    .join('')
    .toUpperCase()

  function isActive(href: string) {
    if (href === '/dashboard') return router.pathname === '/dashboard'
    return router.pathname.startsWith(href)
  }

  const NavLinks = () => (
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      <ul className="space-y-0.5">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span className={cn(
                isActive(item.href) ? 'text-primary-600' : 'text-gray-400'
              )}>
                {item.icon}
              </span>
              {item.label}
              {isActive(item.href) && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-400" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )

  const UserSection = () => (
    <div className="border-t border-gray-200 px-3 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
          title="Sign out"
          aria-label="Sign out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )

  const Logo = () => (
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-200">
      <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <span className="text-base font-bold text-gray-900">TutorHub</span>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-30">
        <Logo />
        <NavLinks />
        <UserSection />
      </aside>

      {/* Mobile toggle button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-lg p-2 shadow-card"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'md:hidden fixed left-0 top-0 z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">TutorHub</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <NavLinks />
        <UserSection />
      </aside>
    </>
  )
}
