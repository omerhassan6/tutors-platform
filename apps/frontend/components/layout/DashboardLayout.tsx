import React from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopNav />

      {/* Main content — offset by sidebar width on desktop, top nav height always */}
      <main
        id="main-content"
        className="md:ml-64 pt-16 min-h-screen"
      >
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
