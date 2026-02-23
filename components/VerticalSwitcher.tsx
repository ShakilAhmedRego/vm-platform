'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { VERTICALS } from '@/lib/verticals'

export default function VerticalSwitcher({
  open,
  onClose,
  activeKey,
}: {
  open: boolean
  onClose: () => void
  activeKey: string
}) {
  const router = useRouter()
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const items = useMemo(() => {
    const all = Object.values(VERTICALS)
    const query = q.trim().toLowerCase()
    if (!query) return all
    return all.filter(
      (v) =>
        v.label.toLowerCase().includes(query) ||
        v.shortLabel.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
    )
  }, [q])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[min(920px,calc(100vw-24px))] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search verticals…"
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 outline-none"
          />
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((v) => (
            <button
              key={v.key}
              onClick={() => {
                router.push(`/dashboard/${v.key}`)
                onClose()
              }}
              className={`text-left rounded-xl border p-3 transition bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 border-gray-200 dark:border-gray-800 ${
                v.key === activeKey ? 'ring-2 ring-offset-0 ring-gray-300 dark:ring-gray-700' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-lg">{v.icon}</div>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.accentColor }} />
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                {v.shortLabel}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {v.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
