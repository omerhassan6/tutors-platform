import React from 'react'
import { cn } from '../../lib/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-card',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-100 flex items-center justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardBody({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-100 flex items-center gap-3',
        className
      )}
    >
      {children}
    </div>
  )
}
