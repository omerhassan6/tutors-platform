import React from 'react'
import { cn } from '../../lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = inputId ? `${inputId}-error` : undefined
  const hintId = inputId ? `${inputId}-hint` : undefined

  const describedBy = [
    error && errorId,
    hint && hintId,
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors',
          'focus:outline-none focus:ring-1',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          className
        )}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}
