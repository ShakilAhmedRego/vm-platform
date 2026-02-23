'use client'

import { ReactNode } from 'react'

export default function KPICard({
  label,
  value,
  hint,
  accentColor,
}: {
  label: string
  value: ReactNode
  hint?: string
  accentColor?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        {accentColor ? <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} /> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div> : null}
    </div>
  )
}
