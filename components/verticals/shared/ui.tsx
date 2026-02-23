'use client'

import { useEffect, useState } from 'react'
import { BookmarkPlus, ChevronDown, Download, Trash2 } from 'lucide-react'

export type SavedViewState = {
  name: string
  search: string
  segment: string
  sort: string
  filters: Record<string, string>
  createdAt: number
}

const keyFor = (verticalKey: string) => `vm:savedViews:\${verticalKey}`

export function useSavedViews(verticalKey: string) {
  const [views, setViews] = useState<SavedViewState[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(verticalKey))
      const parsed = raw ? (JSON.parse(raw) as SavedViewState[]) : []
      setViews(Array.isArray(parsed) ? parsed : [])
    } catch {
      setViews([])
    }
  }, [verticalKey])

  const persist = (next: SavedViewState[]) => {
    setViews(next)
    try {
      localStorage.setItem(keyFor(verticalKey), JSON.stringify(next))
    } catch {}
  }

  return {
    views,
    save: (s: Omit<SavedViewState, 'createdAt'>) => {
      const next: SavedViewState[] = [
        { ...s, createdAt: Date.now() },
        ...views.filter(v => v.name !== s.name),
      ].slice(0, 12)
      persist(next)
    },
    remove: (name: string) => persist(views.filter(v => v.name !== name)),
    clear: () => persist([]),
    load: (name: string) => views.find(v => v.name === name) ?? null,
  }
}

export function SectionHeader(props: { title: string; hint?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{props.title}</h3>
        {props.hint ? <div className="text-xs text-gray-400 mt-0.5">{props.hint}</div> : null}
      </div>
      {props.right ? <div className="shrink-0">{props.right}</div> : null}
    </div>
  )
}

export function EmptyCard(props: { icon?: string; title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="text-3xl mb-2">{props.icon ?? '✨'}</div>
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{props.title}</div>
        <div className="text-xs text-gray-400 mt-1">{props.body}</div>
        {props.cta ? <div className="mt-3 flex justify-center">{props.cta}</div> : null}
      </div>
    </div>
  )
}

export function SegTabs(props: {
  value: string
  options: { key: string; label: string; hint?: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
      {props.options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => props.onChange(o.key)}
          className={[
            'px-2.5 py-1 text-xs rounded-lg transition-colors',
            props.value === o.key
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
          ].join(' ')}
          title={o.hint ?? o.label}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SortPills(props: {
  value: string
  options: { key: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {props.options.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => props.onChange(o.key)}
          className={[
            'text-xs px-2 py-1 rounded-full border transition-colors',
            props.value === o.key
              ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
              : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SearchBox(props: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={props.value}
      onChange={e => props.onChange(e.target.value)}
      placeholder={props.placeholder ?? 'Search…'}
      className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
    />
  )
}

export function SavedViewsBar(props: {
  verticalKey: string
  current: { search: string; segment: string; sort: string; filters: Record<string, string> }
  onApply: (state: { search: string; segment: string; sort: string; filters: Record<string, string> }) => void
}) {
  const sv = useSavedViews(props.verticalKey)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const hasAny = sv.views.length > 0

  return (
    <div className="flex items-center gap-2 relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 inline-flex items-center gap-1.5"
        title="Saved views"
      >
        <ChevronDown className="w-3.5 h-3.5" />
        Views
        {hasAny ? <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{sv.views.length}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-9 z-50 w-72 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-2">
          <div className="px-2 pt-1 pb-2">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Saved Views</div>
            <div className="text-[11px] text-gray-400">UI-only. Stored in this browser.</div>
          </div>

          <div className="px-2 pb-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name this view…"
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            />
            <button
              type="button"
              onClick={() => {
                const n = name.trim()
                if (!n) return
                sv.save({ name: n, ...props.current })
                setName('')
              }}
              className="mt-2 w-full text-xs px-2.5 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 inline-flex items-center justify-center gap-2"
            >
              <BookmarkPlus className="w-3.5 h-3.5" /> Save current view
            </button>
          </div>

          <div className="max-h-56 overflow-auto px-1 pb-1">
            {sv.views.length === 0 ? (
              <div className="p-3 text-xs text-gray-400">No saved views yet.</div>
            ) : (
              sv.views.map(v => (
                <div key={v.name} className="flex items-center justify-between gap-2 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      props.onApply({ search: v.search, segment: v.segment, sort: v.sort, filters: v.filters })
                      setOpen(false)
                    }}
                    className="text-left flex-1"
                  >
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-100">{v.name}</div>
                    <div className="text-[11px] text-gray-400">segment: {v.segment} · sort: {v.sort}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => sv.remove(v.name)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BulkBar(props: {
  selectedCount: number
  unlockedSelectedCount: number
  onExportUnlocked: () => void
  onExportSelectedUnlocked: () => void
  onClearSelection: () => void
  extra?: React.ReactNode
}) {
  if (props.selectedCount === 0) return null
  return (
    <div className="sticky bottom-0 z-20 w-full">
      <div className="mx-auto max-w-7xl px-6 pb-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur p-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{props.selectedCount}</span> selected ·{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{props.unlockedSelectedCount}</span> unlocked selected
          </div>
          <div className="flex items-center gap-2">
            {props.extra}
            <button
              type="button"
              onClick={props.onExportUnlocked}
              className="text-xs px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 inline-flex items-center gap-2"
              title="Export unlocked rows only"
            >
              <Download className="w-3.5 h-3.5" /> Export unlocked
            </button>
            <button
              type="button"
              onClick={props.onExportSelectedUnlocked}
              className="text-xs px-2.5 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 inline-flex items-center gap-2 disabled:opacity-50"
              title="Export selected unlocked only"
              disabled={props.unlockedSelectedCount === 0}
            >
              <Download className="w-3.5 h-3.5" /> Export selected unlocked
            </button>
            <button
              type="button"
              onClick={props.onClearSelection}
              className="text-xs px-2.5 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
