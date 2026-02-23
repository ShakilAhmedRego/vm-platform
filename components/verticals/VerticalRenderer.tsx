'use client'

import dynamic from 'next/dynamic'
import { VERTICALS } from '@/lib/verticals'

export default function VerticalRenderer({ verticalKey }: { verticalKey: string }) {
  const validKey = VERTICALS[verticalKey] ? verticalKey : 'dealflow'

  const Dashboard = dynamic(() => import(`@/components/verticals/${validKey}/Dashboard`), {
    loading: () => (
      <div className="p-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200/60 dark:bg-gray-800/60" />
          ))}
        </div>
        <div className="mt-6 h-64 rounded-xl bg-gray-200/60 dark:bg-gray-800/60" />
      </div>
    ),
  })

  return <Dashboard />
}
