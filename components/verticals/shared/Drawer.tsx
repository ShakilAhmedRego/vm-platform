'use client'

import { useEffect } from 'react'

export default function Drawer({
  open,
  title,
  subtitle,
  locked,
  tabs,
  activeTab,
  setActiveTab,
  onClose,
  onUnlock,
}: {
  open: boolean
  title: string
  subtitle?: string
  locked: boolean
  tabs: { key: string; label: string; content: React.ReactNode }[]
  activeTab: string
  setActiveTab: (k: string) => void
  onClose: () => void
  onUnlock: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-[min(480px,100vw)] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
              {subtitle ? <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div> : null}
              <div className="mt-2 text-xs">{locked ? <span className="text-amber-600">Locked</span> : <span className="text-emerald-600">Unlocked</span>}</div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-800" aria-label="Close">✕</button>
          </div>

          {locked ? (
            <button onClick={onUnlock} className="mt-3 w-full px-3 py-2 rounded-md bg-gray-900 text-white text-sm font-medium">
              Unlock for 1 Credit
            </button>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  activeTab === t.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-auto flex-1">{tabs.find((t) => t.key === activeTab)?.content}</div>
      </aside>
    </div>
  )
}
