import React from 'react'
import { cn } from '../../lib/cn'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded-md',
        className
      )}
      aria-hidden="true"
    />
  )
}
