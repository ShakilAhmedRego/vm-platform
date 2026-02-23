'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { VERTICALS } from '@/lib/verticals'
import { getUser, getUserRole } from '@/lib/auth'
import { getCreditBalance } from '@/lib/credits'
import VerticalSwitcher from '@/components/VerticalSwitcher'
import { Shield, Moon, Sun } from 'lucide-react'

function getVerticalKeyFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.indexOf('dashboard')
  const key = idx >= 0 ? parts[idx + 1] : null
  return key && VERTICALS[key] ? key : 'dealflow'
}

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const activeKey = useMemo(() => getVerticalKeyFromPath(pathname), [pathname])
  const active = VERTICALS[activeKey]

  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('vm_theme') as any) || 'light'
  })

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
    localStorage.setItem('vm_theme', theme)
  }, [theme])

  useEffect(() => {
    const run = async () => {
      const { data } = await getUser()
      const user = data.user
      if (!user) return
      setRole(await getUserRole(user.id))
      try {
        setCredits(await getCreditBalance(user.id))
      } catch {
        setCredits(0)
      }
    }
    void run()
  }, [activeKey])

  return (
    <header className="sticky top-0 z-50 h-12 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <div className="h-12 px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => router.push('/dashboard/dealflow')}>
          <div className="w-7 h-7 rounded-md bg-gray-900 dark:bg-white" />
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">VerifiedMeasure</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm flex items-center gap-2"
            onClick={() => setSwitcherOpen(true)}
          >
            <span>{active.icon}</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">{active.shortLabel}</span>
            <span className="text-gray-400">▾</span>
          </button>

          <div className="hidden md:flex items-center text-xs text-gray-500 dark:text-gray-400">
            / dashboard / {active.key}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100">
            Credits: <span className="font-semibold">{credits}</span>
          </div>

          <button
            className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-center"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-gray-200" /> : <Moon className="w-4 h-4 text-gray-800" />}
          </button>

          {role === 'admin' ? (
            <button
              className="w-9 h-9 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-center"
              onClick={() => router.push('/dashboard/dealflow?admin=1')}
              aria-label="Admin"
              title="Admin"
            >
              <Shield className="w-4 h-4 text-gray-900 dark:text-gray-100" />
            </button>
          ) : null}
        </div>
      </div>

      <VerticalSwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} activeKey={activeKey} />
    </header>
  )
}
