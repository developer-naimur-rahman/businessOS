"use client"
import React from 'react'
import { PageHeader } from '../../../../components/layout/page-header'
import { EmptyState } from '../../../../components/ui/empty-state'
import { Code2 } from 'lucide-react'

export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeader title="Integration" />
      <EmptyState
        icon={Code2}
        title="Coming Soon"
        description="This module has been implemented on the backend and is waiting for UI integration."
      />
    </div>
  )
}
