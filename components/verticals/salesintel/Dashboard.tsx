'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData } from '../shared/useVerticalData'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerSection } from '../shared/Drawer'
import { safeRender } from '../shared/GenericDashboard'
import { asNumber, asString, containsCI, pickFirst } from '../shared/field'
import { BulkBar, EmptyCard, SavedViewsBar, SearchBox, SectionHeader, SegTabs, SortPills } from '../shared/ui'
import { exportCsv, filterSelectedUnlockedRows, filterUnlockedRows } from '../shared/exportCsv'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { Lock } from 'lucide-react'
import { Mail, Phone, Search, Sparkles, User } from 'lucide-react'
import type { ReactNode } from 'react'

const verticalKey = 'salesintel'

function mask(v: unknown, unlocked: boolean) {
  if (unlocked) return safeRender(v)
  return <span className="text-gray-300 dark:text-gray-700">●●●●</span>
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const d = useVerticalData(verticalKey)
  const rows = d.data

  // Workbench state
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<'all' | 'high' | 'new' | 'unlocked'>('all')
  const [sort, setSort] = useState<'score' | 'company'>('score')
  const [filters, setFilters] = useState<Record<string, string>>({ industry: 'All', region: 'All' })
  const [activeId, setActiveId] = useState<string | null>(null)

  // Saved views
  const currentView = { search, segment, sort, filters }

  const filtered = useMemo(() => {
    const q = search.trim()
    let list = rows.slice()

    // segments
    if (segment === 'unlocked') list = list.filter(r => d.unlockedIds.has(String((r as any).id)))
    if (segment === 'high') list = list.filter(r => asNumber(pickFirst(r, ['score', 'lead_score', 'intelligence_score']), 0) >= 80)
    if (segment === 'new') list = list.slice(0, 50)

    // filters
    if ((filters.industry ?? 'All') !== 'All') {
      list = list.filter(r => asString(pickFirst(r, ['industry', 'sector']), '—') === filters.industry)
    }
    if ((filters.region ?? 'All') !== 'All') {
      list = list.filter(r => asString(pickFirst(r, ['region', 'hq_location', 'location']), '—') === filters.region)
    }

    // search
    if (q) {
      list = list.filter(r => {
        const s = [
          asString(pickFirst(r, ['full_name', 'name', 'contact_name']), ''),
          asString(pickFirst(r, ['company', 'company_name']), ''),
          asString(pickFirst(r, ['title', 'role']), ''),
          asString(pickFirst(r, ['industry', 'sector']), ''),
        ].join(' ')
        return containsCI(s, q)
      })
    }

    // sort
    list.sort((a, b) => {
      if (sort === 'company') return asString(pickFirst(a, ['company', 'company_name']), '').localeCompare(asString(pickFirst(b, ['company', 'company_name']), ''))
      return asNumber(pickFirst(b, ['score', 'lead_score', 'intelligence_score']), 0) - asNumber(pickFirst(a, ['score', 'lead_score', 'intelligence_score']), 0)
    })

    return list
  }, [rows, search, segment, sort, filters, d.unlockedIds])

  const industries = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      const v = asString(pickFirst(r, ['industry', 'sector']), '')
      if (v && v !== '—') set.add(v)
    }
    return ['All', ...Array.from(set).slice(0, 12)]
  }, [rows])

  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      const v = asString(pickFirst(r, ['region', 'hq_location', 'location']), '')
      if (v && v !== '—') set.add(v)
    }
    return ['All', ...Array.from(set).slice(0, 12)]
  }, [rows])

  const activeRow = useMemo(() => {
    const r = filtered.find(r => String((r as any).id) === String(activeId)) ?? filtered[0] ?? null
    return r ? (String((r as any).id) ? r : null) : null
  }, [filtered, activeId])

  useEffect(() => {
    if (!activeId && filtered[0]) setActiveId(String((filtered[0] as any).id))
  }, [filtered, activeId])

  const scoreBuckets = useMemo(() => {
    const buckets = [
      { label: '90–100', min: 90, max: 100, count: 0 },
      { label: '75–89', min: 75, max: 89, count: 0 },
      { label: '50–74', min: 50, max: 74, count: 0 },
      { label: '<50', min: -999, max: 49, count: 0 },
    ]
    for (const r of filtered) {
      const s = asNumber(pickFirst(r, ['score', 'lead_score', 'intelligence_score']), 0)
      const b = buckets.find(b => s >= b.min && s <= b.max)
      if (b) b.count++
    }
    return buckets
  }, [filtered])

  const selectedUnlockedCount = useMemo(() => {
    let c = 0
    for (const id of d.selectedIds) if (d.unlockedIds.has(id)) c++
    return c
  }, [d.selectedIds, d.unlockedIds])

  function exportUnlocked(all: boolean) {
    const out = all
      ? filterUnlockedRows(rows, d.unlockedIds)
      : filterSelectedUnlockedRows(rows, d.unlockedIds, d.selectedIds)
    exportCsv({
      filename: all ? 'salesintel-unlocked.csv' : 'salesintel-selected-unlocked.csv',
      rows: out,
      columns: [
        { key: 'full_name', label: 'Name', keys: ['full_name', 'name', 'contact_name'] },
        { key: 'title', label: 'Title', keys: ['title', 'role'] },
        { key: 'company', label: 'Company', keys: ['company', 'company_name'] },
        { key: 'email', label: 'Email', keys: ['email'] },
        { key: 'phone', label: 'Phone', keys: ['phone'] },
        { key: 'industry', label: 'Industry', keys: ['industry', 'sector'] },
        { key: 'score', label: 'Score', keys: ['score', 'lead_score', 'intelligence_score'] },
      ],
    })
  }

  function copyOutreachSnippet(row: Record<string, unknown>) {
    const name = asString(pickFirst(row, ['full_name', 'name', 'contact_name']), 'there')
    const company = asString(pickFirst(row, ['company', 'company_name']), 'your team')
    const snippet = `Hi ${name} — quick note. We built VerifiedMeasure to help teams like ${company} find verified contacts and unlock only what they need. Open to a 10‑minute walkthrough?`
    navigator.clipboard?.writeText(snippet).catch(() => {})
  }

  function drawerTabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    return [
      {
        label: 'Contact',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Identity">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-gray-400">Name</div><div className="font-medium">{safeRender(pickFirst(row, ['full_name','name','contact_name']))}</div></div>
                <div><div className="text-xs text-gray-400">Title</div><div className="font-medium">{safeRender(pickFirst(row, ['title','role']))}</div></div>
                <div><div className="text-xs text-gray-400">Email</div><div className="font-medium">{mask(pickFirst(row, ['email']), unlocked)}</div></div>
                <div><div className="text-xs text-gray-400">Phone</div><div className="font-medium">{mask(pickFirst(row, ['phone']), unlocked)}</div></div>
              </div>
            </DrawerSection>
            <DrawerSection title="Notes">
              <div className="text-sm text-gray-600 dark:text-gray-300">{safeRender(pickFirst(row, ['notes','summary']))}</div>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Firmographics',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Company">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-gray-400">Company</div><div className="font-medium">{safeRender(pickFirst(row, ['company','company_name']))}</div></div>
                <div><div className="text-xs text-gray-400">Industry</div><div className="font-medium">{safeRender(pickFirst(row, ['industry','sector']))}</div></div>
                <div><div className="text-xs text-gray-400">Region</div><div className="font-medium">{safeRender(pickFirst(row, ['region','location','hq_location']))}</div></div>
                <div><div className="text-xs text-gray-400">Size</div><div className="font-medium">{safeRender(pickFirst(row, ['company_size','size']))}</div></div>
              </div>
            </DrawerSection>
            <DrawerSection title="Signals">
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                <li>Score buckets drive the right-side “Signal Mix”.</li>
                <li>Exports include unlocked only.</li>
              </ul>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Outreach',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Suggested Snippet">
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-sm text-gray-700 dark:text-gray-200">
                Hi {asString(pickFirst(row, ['full_name','name','contact_name']), 'there')} — quick note. We built VerifiedMeasure to help teams find verified contacts and unlock only what they need. Open to a 10‑minute walkthrough?
              </div>
              <button onClick={() => copyOutreachSnippet(row)} className="mt-3 text-xs px-3 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                Copy snippet
              </button>
            </DrawerSection>
            <DrawerSection title="Rules">
              <div className="text-sm text-gray-600 dark:text-gray-300">Unlock to reveal phone/email. Keep previews masked.</div>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Activity',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Activity">
              <div className="text-sm text-gray-600 dark:text-gray-300">UI-only activity panel — wire to your CRM later without touching core architecture.</div>
            </DrawerSection>
            <DrawerSection title="Next">
              <div className="text-sm text-gray-600 dark:text-gray-300">Use Saved Views to persist your targeting segments locally.</div>
            </DrawerSection>
          </div>
        ),
      },
    ]
  }

  const unlockedActive = activeRow ? d.unlockedIds.has(String((activeRow as any).id)) : false

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Unique header module */}
      <div className="rounded-3xl border border-rose-100 dark:border-rose-900 bg-gradient-to-br from-white to-rose-50 dark:from-gray-950 dark:to-rose-950/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-900/30 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> Lead Workbench
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">B2B Sales Intelligence</h1>
            <p className="text-sm text-gray-500 mt-1">Three-column workbench: filter → list → inline preview. Drawer is for full profiles.</p>
          </div>
          <div className="flex items-center gap-2">
            <SavedViewsBar
              verticalKey={verticalKey}
              current={currentView}
              onApply={s => { setSearch(s.search); setSegment(s.segment as any); setSort(s.sort as any); setFilters(s.filters || {}) }}
            />
            <div className="rounded-2xl border border-rose-100 dark:border-rose-900 bg-white/70 dark:bg-gray-950/40 px-4 py-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Credits</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{d.creditBalance}</div>
            </div>
          </div>
        </div>
      </div>

      {d.error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
          {d.error}
        </div>
      ) : null}

      {/* 3-column workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filter rail */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-3">
            <SectionHeader title="Targeting" hint="Search, segments, and facets." />
            <SearchBox value={search} onChange={setSearch} placeholder="Search name, title, company…" />
            <SegTabs
              value={segment}
              onChange={v => setSegment(v as any)}
              options={[
                { key: 'all', label: 'All' },
                { key: 'high', label: 'High Score' },
                { key: 'new', label: 'New' },
                { key: 'unlocked', label: 'Unlocked' },
              ]}
            />
            <SortPills
              value={sort}
              onChange={v => setSort(v as any)}
              options={[
                { key: 'score', label: 'Sort: Score' },
                { key: 'company', label: 'Sort: Company' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">Industry</div>
                <select
                  value={filters.industry ?? 'All'}
                  onChange={e => setFilters(p => ({ ...p, industry: e.target.value }))}
                  className="w-full text-xs px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  {industries.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Region</div>
                <select
                  value={filters.region ?? 'All'}
                  onChange={e => setFilters(p => ({ ...p, region: e.target.value }))}
                  className="w-full text-xs px-2 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  {regions.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Signals panel */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Signal Mix" hint="Score buckets from your current view." />
            <div className="mt-4 h-[220px]">
              {filtered.length === 0 ? (
                <EmptyCard icon="🎯" title="No leads in this view" body="Change filters or load seed data to see the distribution." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBuckets} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#fb7185" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Center: card list */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Leads</div>
              <div className="text-xs text-gray-400">{filtered.length} results</div>
            </div>
            {d.loading ? (
              <div className="p-8 text-sm text-gray-400 animate-pulse">Loading leads…</div>
            ) : filtered.length === 0 ? (
              <div className="p-8"><EmptyCard icon="🧾" title="No leads found" body="Try a different segment or clear filters." /></div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[720px] overflow-auto">
                {filtered.slice(0, 120).map((r: any) => {
                  const id = String(r.id)
                  const unlocked = d.unlockedIds.has(id)
                  const selected = d.selectedIds.has(id)
                  const score = asNumber(pickFirst(r, ['score','lead_score','intelligence_score']), 0)
                  const active = String(activeId) === id
                  return (
                    <div
                      key={id}
                      className={[
                        'px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
                        active ? 'bg-rose-50 dark:bg-rose-900/20' : '',
                      ].join(' ')}
                      onClick={() => setActiveId(id)}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); d.toggleSelect(id) }}
                          className={[
                            'mt-1 w-5 h-5 rounded border flex items-center justify-center',
                            selected ? 'bg-rose-600 border-rose-600 text-white' : 'border-gray-300 dark:border-gray-700 text-transparent',
                          ].join(' ')}
                          title="Select"
                        >
                          ✓
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{safeRender(pickFirst(r, ['full_name','name','contact_name']))}</div>
                            {!unlocked ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Locked</span> : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Unlocked</span>}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">{score}</span>
                          </div>
                          <div className="text-xs text-gray-400 truncate">{safeRender(pickFirst(r, ['title','role']))} · {safeRender(pickFirst(r, ['company','company_name']))}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: inline preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Inline Preview" hint="Preview details without leaving the list." />
            {activeRow ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{safeRender(pickFirst(activeRow, ['full_name','name','contact_name']))}</div>
                    <div className="text-sm text-gray-500 truncate">{safeRender(pickFirst(activeRow, ['title','role']))} · {safeRender(pickFirst(activeRow, ['company','company_name']))}</div>
                  </div>
                  <User className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Email</div>
                    <div className="text-sm font-medium">{mask(pickFirst(activeRow, ['email']), unlockedActive)}</div>
                  </div>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Phone</div>
                    <div className="text-sm font-medium">{mask(pickFirst(activeRow, ['phone']), unlockedActive)}</div>
                  </div>
                </div>

                {!unlockedActive ? (
                  <button
                    type="button"
                    onClick={() => { d.toggleSelect(String((activeRow as any).id)); d.handleUnlock() }}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  >
                    Unlock this lead (1 credit)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                    <Mail className="w-3.5 h-3.5" /> Unlocked — ready for outreach
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => d.setDrawerRow(activeRow)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  >
                    Open full profile
                  </button>
                  <button
                    type="button"
                    onClick={() => copyOutreachSnippet(activeRow)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Copy snippet
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-60"><EmptyCard icon="👀" title="No lead selected" body="Pick a lead from the center list to preview." /></div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Highlights" hint="Ranked from current view." />
            <div className="mt-4 space-y-2">
              {filtered.slice(0, 5).map((r: any) => {
                const score = asNumber(pickFirst(r, ['score','lead_score','intelligence_score']), 0)
                const id = String(r.id)
                return (
                  <button key={id} onClick={() => setActiveId(id)} className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-gray-300 dark:hover:border-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{safeRender(pickFirst(r, ['full_name','name']))}</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100/70 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">{score}</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">{safeRender(pickFirst(r, ['company','company_name']))}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <UnlockBar
        selectedCount={d.selectedIds.size}
        unlocking={d.unlocking}
        creditBalance={d.creditBalance}
        onUnlock={d.handleUnlock}
        onClear={d.clearSelection}
      />

      <BulkBar
        selectedCount={d.selectedIds.size}
        unlockedSelectedCount={selectedUnlockedCount}
        onClearSelection={d.clearSelection}
        onExportUnlocked={() => exportUnlocked(true)}
        onExportSelectedUnlocked={() => exportUnlocked(false)}
        extra={
          <button
            type="button"
            onClick={() => { if (activeRow) copyOutreachSnippet(activeRow) }}
            className="text-xs px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
          >
            Copy outreach snippet
          </button>
        }
      />

      {d.drawerRow ? (
        <Drawer
          open={!!d.drawerRow}
          onClose={() => d.setDrawerRow(null)}
          title={asString(pickFirst(d.drawerRow as any, ['full_name','name','contact_name']), 'Lead')}
          isUnlocked={d.unlockedIds.has(String((d.drawerRow as any).id))}
          onUnlock={() => { d.toggleSelect(String((d.drawerRow as any).id)); d.handleUnlock() }}
          unlocking={d.unlocking}
          tabs={drawerTabs(d.drawerRow, d.unlockedIds.has(String((d.drawerRow as any).id)))}
        />
      ) : null}
    </div>
  )
}
