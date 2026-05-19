import React from 'react'
import { Card } from '../../ui/Card'
import { Skeleton } from '../../ui/Skeleton'

export function StudentCardSkeleton() {
  return (
    <Card className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full shrink-0" />
      </div>

      {/* Details */}
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </Card>
  )
}
