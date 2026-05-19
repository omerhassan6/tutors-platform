import React from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './Spinner'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 border border-transparent shadow-sm',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-primary-500 border border-gray-300 shadow-sm',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400 border border-transparent',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 border border-transparent shadow-sm',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-current" />
      ) : icon ? (
        <span className="shrink-0 w-4 h-4">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  )
}
