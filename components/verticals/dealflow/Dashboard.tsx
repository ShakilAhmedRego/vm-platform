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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ArrowUpRight, Building2, Filter, Flame, Lock, Target } from 'lucide-react'
import type { ReactNode } from 'react'

const verticalKey = 'dealflow'

const STAGE_COLORS: Record<string, string> = {
  'Seed': '#818cf8',
  'Pre-seed': '#c4b5fd',
  'Series A': '#6366f1',
  'Series B': '#4f46e5',
  'Series C': '#4338ca',
  'Series D+': '#3730a3',
  'Growth': '#a78bfa',
  'Unknown': '#94a3b8',
}

function bucketStage(raw: string): string {
  const s = raw.trim()
  if (!s) return 'Unknown'
  if (/pre[- ]seed/i.test(s)) return 'Pre-seed'
  if (/seed/i.test(s)) return 'Seed'
  if (/series\s*a/i.test(s)) return 'Series A'
  if (/series\s*b/i.test(s)) return 'Series B'
  if (/series\s*c/i.test(s)) return 'Series C'
  if (/series\s*d/i.test(s)) return 'Series D+'
  if (/growth|late/i.test(s)) return 'Growth'
  return s.length > 18 ? s.slice(0, 18) + '…' : s
}

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)) }, [])

  const d = useVerticalData(verticalKey)
  const rows = d.data

  // UI state
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<'all' | 'active' | 'prospect' | 'closed'>('all')
  const [sort, setSort] = useState<'intel' | 'raised' | 'recent'>('intel')
  const [filters, setFilters] = useState<Record<string, string>>({ stage: 'All' })
  const [tableOpen, setTableOpen] = useState(false)

  const stageFilter = filters.stage ?? 'All'

  const filtered = useMemo(() => {
    const q = search.trim()
    let list = rows.slice()

    // segment
    if (segment !== 'all') {
      list = list.filter(r => {
        const ws = asString(pickFirst(r, ['workflow_status', 'status', 'pipeline_status']), '').toLowerCase()
        if (!ws) return segment === 'prospect' ? true : false
        if (segment === 'active') return ws.includes('active')
        if (segment === 'prospect') return ws.includes('prospect') || ws.includes('pipeline')
        return ws.includes('closed') || ws.includes('lost') || ws.includes('won')
      })
    }

    // stage filter from legend
    if (stageFilter !== 'All') {
      list = list.filter(r => bucketStage(asString(pickFirst(r, ['funding_stage', 'stage']), 'Unknown')) === stageFilter)
    }

    // search
    if (q) {
      list = list.filter(r => {
        const name = asString(pickFirst(r, ['company_name', 'name', 'company']), '')
        const sector = asString(pickFirst(r, ['sector', 'industry']), '')
        const hq = asString(pickFirst(r, ['hq_location', 'location', 'hq']), '')
        return containsCI(name + ' ' + sector + ' ' + hq, q)
      })
    }

    // sort
    list.sort((a, b) => {
      if (sort === 'raised') {
        return asNumber(pickFirst(b, ['total_raised', 'raised', 'funding_total']), 0) - asNumber(pickFirst(a, ['total_raised', 'raised', 'funding_total']), 0)
      }
      if (sort === 'recent') {
        const ad = asNumber(pickFirst(a, ['last_round_date', 'updated_at', 'created_at']), 0)
        const bd = asNumber(pickFirst(b, ['last_round_date', 'updated_at', 'created_at']), 0)
        return bd - ad
      }
      return asNumber(pickFirst(b, ['intelligence_score', 'score']), 0) - asNumber(pickFirst(a, ['intelligence_score', 'score']), 0)
    })

    return list
  }, [rows, search, segment, sort, stageFilter])

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of filtered) {
      const st = bucketStage(asString(pickFirst(r, ['funding_stage', 'stage']), 'Unknown'))
      counts[st] = (counts[st] ?? 0) + 1
    }
    return Object.entries(counts)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
  }, [filtered])

  const pipelineGroups = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const r of filtered) {
      const ws = asString(pickFirst(r, ['workflow_status', 'status', 'pipeline_status']), 'Prospect')
      const key = ws || 'Prospect'
      groups[key] = groups[key] ?? []
      groups[key].push(r)
    }
    const order = Object.entries(groups).map(([k, v]) => ({ key: k, count: v.length, rows: v }))
    order.sort((a, b) => b.count - a.count)
    return order
  }, [filtered])

  const hotDeals = useMemo(() => {
    const scored = filtered.map(r => {
      const score = asNumber(pickFirst(r, ['intelligence_score', 'score']), 0)
      const raised = asNumber(pickFirst(r, ['total_raised', 'raised']), 0)
      const heat = score * 1.2 + Math.log10(Math.max(raised, 1)) * 10
      return { r, heat, score, raised }
    })
    scored.sort((a, b) => b.heat - a.heat)
    return scored.slice(0, 6)
  }, [filtered])

  const insightBullets = useMemo(() => {
    const topStage = stageData[0]?.stage ?? '—'
    const activeCount = filtered.filter(r => asString(pickFirst(r, ['workflow_status', 'status']), '').toLowerCase().includes('active')).length
    const hiIntel = filtered.filter(r => asNumber(pickFirst(r, ['intelligence_score', 'score']), 0) >= 75).length
    return [
      `Most common stage: ${topStage}`,
      `${activeCount} active pipeline items`,
      `${hiIntel} high-intel companies (≥75)`,
    ]
  }, [stageData, filtered])

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
      filename: all ? 'dealflow-unlocked.csv' : 'dealflow-selected-unlocked.csv',
      rows: out,
      columns: [
        { key: 'company_name', label: 'Company', keys: ['company_name', 'name', 'company'] },
        { key: 'funding_stage', label: 'Funding Stage', keys: ['funding_stage', 'stage'] },
        { key: 'sector', label: 'Sector', keys: ['sector', 'industry'] },
        { key: 'hq_location', label: 'HQ', keys: ['hq_location', 'location'] },
        { key: 'total_raised', label: 'Total Raised', keys: ['total_raised', 'raised'] },
        { key: 'intelligence_score', label: 'Intel Score', keys: ['intelligence_score', 'score'] },
        { key: 'workflow_status', label: 'Workflow', keys: ['workflow_status', 'status'] },
      ],
    })
  }

  function drawerTabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    const masked = (v: unknown) => (m ? '●●●●' : safeRender(v))
    return [
      {
        label: 'Company',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Profile">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-gray-400">Company</div><div className="font-medium">{safeRender(pickFirst(row, ['company_name', 'name', 'company']))}</div></div>
                <div><div className="text-xs text-gray-400">Sector</div><div className="font-medium">{safeRender(pickFirst(row, ['sector', 'industry']))}</div></div>
                <div><div className="text-xs text-gray-400">HQ</div><div className="font-medium">{safeRender(pickFirst(row, ['hq_location', 'location', 'hq']))}</div></div>
                <div><div className="text-xs text-gray-400">Founded</div><div className="font-medium">{safeRender(pickFirst(row, ['founded_year', 'founded']))}</div></div>
              </div>
            </DrawerSection>
            <DrawerSection title="Signals">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">Stage</div>
                  <div className="text-sm font-semibold">{safeRender(pickFirst(row, ['funding_stage', 'stage']))}</div>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">Intel</div>
                  <div className="text-sm font-semibold">{safeRender(pickFirst(row, ['intelligence_score', 'score']))}</div>
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider">Workflow</div>
                  <div className="text-sm font-semibold">{safeRender(pickFirst(row, ['workflow_status', 'status']))}</div>
                </div>
              </div>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Investors',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Cap Table">
              <div className="space-y-2 text-sm">
                <div><span className="text-xs text-gray-400">Lead Investors</span><div className="font-medium">{masked(pickFirst(row, ['lead_investors', 'investors']))}</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-gray-400">Investor Count</div><div className="font-medium">{masked(pickFirst(row, ['investor_count']))}</div></div>
                  <div><div className="text-xs text-gray-400">Board</div><div className="font-medium">{masked(pickFirst(row, ['board_members', 'board']))}</div></div>
                </div>
              </div>
            </DrawerSection>
            <DrawerSection title="Notes">
              <div className="text-sm text-gray-600 dark:text-gray-300">{masked(pickFirst(row, ['notes', 'memo', 'description']))}</div>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Financials',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Round Metrics">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-gray-400">Total Raised</div><div className="font-medium">{masked(pickFirst(row, ['total_raised', 'raised']))}</div></div>
                <div><div className="text-xs text-gray-400">Valuation</div><div className="font-medium">{masked(pickFirst(row, ['valuation']))}</div></div>
                <div><div className="text-xs text-gray-400">Last Round</div><div className="font-medium">{safeRender(pickFirst(row, ['last_round_date']))}</div></div>
                <div><div className="text-xs text-gray-400">Revenue Est.</div><div className="font-medium">{masked(pickFirst(row, ['revenue_estimate', 'revenue']))}</div></div>
              </div>
            </DrawerSection>
            <DrawerSection title="Why it matters">
              <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                <li>Sort, segment, and stage filters are computed client-side.</li>
                <li>Exports never include locked sensitive fields.</li>
              </ul>
            </DrawerSection>
          </div>
        ),
      },
      {
        label: 'Pipeline',
        content: (
          <div className="space-y-5">
            <DrawerSection title="Ownership & Next Steps">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-gray-400">Deal Owner</div><div className="font-medium">{masked(pickFirst(row, ['deal_owner', 'owner']))}</div></div>
                <div><div className="text-xs text-gray-400">Next Action</div><div className="font-medium">{masked(pickFirst(row, ['next_action']))}</div></div>
              </div>
            </DrawerSection>
            <DrawerSection title="Description">
              <div className="text-sm text-gray-600 dark:text-gray-300">{safeRender(pickFirst(row, ['description']))}</div>
            </DrawerSection>
            <DrawerSection title="Signals">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Intel score and stage buckets drive the “Hot Deals” list on the dashboard.
              </div>
            </DrawerSection>
          </div>
        ),
      },
    ]
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Unique header module */}
      <div className="rounded-3xl border border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-gray-950 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-900/30 px-2.5 py-1 rounded-full">
              <Target className="w-3.5 h-3.5" /> Pipeline + Stage Intelligence
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">Investment Deal Flow</h1>
            <p className="text-sm text-gray-500 mt-1">A VC-style workbench: stage distribution, pipeline grouping, and heat-ranked deals.</p>
          </div>
          <div className="flex items-center gap-2">
            <SavedViewsBar
              verticalKey={verticalKey}
              current={{ search, segment, sort, filters }}
              onApply={s => { setSearch(s.search); setSegment(s.segment as any); setSort(s.sort as any); setFilters(s.filters || {}) }}
            />
            <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-white/70 dark:bg-gray-950/40 px-4 py-3">
              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Credits</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{d.creditBalance}</div>
            </div>
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Search company, sector, HQ…" />
          <SegTabs
            value={segment}
            onChange={v => setSegment(v as any)}
            options={[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'prospect', label: 'Prospects' },
              { key: 'closed', label: 'Closed' },
            ]}
          />
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-white/70 dark:bg-gray-950/40 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              Stage:
              <select
                value={filters.stage ?? 'All'}
                onChange={e => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                className="text-xs rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 py-1"
              >
                <option value="All">All</option>
                {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <SortPills
              value={sort}
              onChange={v => setSort(v as any)}
              options={[
                { key: 'intel', label: 'Sort: Intel' },
                { key: 'raised', label: 'Sort: Raised' },
                { key: 'recent', label: 'Sort: Recent' },
              ]}
            />
          </div>
        </div>

        {/* Insights callouts */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {insightBullets.map((b, i) => (
            <div key={i} className="rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-white/60 dark:bg-gray-950/40 p-4">
              <div className="text-xs text-gray-600 dark:text-gray-300">{b}</div>
            </div>
          ))}
        </div>
      </div>

      {d.error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-300">
          {d.error}
        </div>
      ) : null}

      {/* Primary split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: stage distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <SectionHeader
            title="Funding Stage Distribution"
            hint="Click a stage to filter the pipeline view."
            right={
              <div className="text-xs text-gray-400">{filtered.length} companies</div>
            }
          />
          <div className="mt-4 h-[240px]">
            {stageData.length === 0 ? (
              <EmptyCard icon="📈" title="No stage data yet" body="Add rows in Supabase to see stage distribution. Layout stays demo-ready." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {stageData.map((e, i) => (
                      <Cell
                        key={i}
                        fill={STAGE_COLORS[e.stage] || '#6366f1'}
                        opacity={stageFilter === 'All' || stageFilter === e.stage ? 1 : 0.25}
                        onClick={() => setFilters(prev => ({ ...prev, stage: (stageFilter === e.stage ? 'All' : e.stage) }))}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(stageData.slice(0, 6)).map(s => (
              <button
                key={s.stage}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, stage: (stageFilter === s.stage ? 'All' : s.stage) }))}
                className={[
                  'rounded-xl border px-3 py-2 text-left transition-colors',
                  stageFilter === s.stage ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
                ].join(' ')}
                title="Filter by stage"
              >
                <div className="text-xs text-gray-500">Stage</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.stage} <span className="text-xs text-gray-400">({s.count})</span></div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: pipeline grouped list + hot deals */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Pipeline Grouping" hint="Grouped by workflow status. Select rows to unlock." />
            <div className="mt-4 space-y-3">
              {pipelineGroups.length === 0 ? (
                <div className="h-[240px]"><EmptyCard icon="🧭" title="No pipeline items" body="Once you add data, groups appear here automatically." /></div>
              ) : (
                pipelineGroups.slice(0, 5).map(g => (
                  <div key={g.key} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{g.key}</div>
                      <div className="text-xs text-gray-400">{g.count}</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {g.rows.slice(0, 3).map((r: any) => {
                        const id = String((r as any).id)
                        const unlocked = d.unlockedIds.has(id)
                        const selected = d.selectedIds.has(id)
                        const score = asNumber(pickFirst(r, ['intelligence_score', 'score']), 0)
                        return (
                          <div
                            key={id}
                            className={['px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors', selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''].join(' ')}
                            onClick={() => d.setDrawerRow(r)}
                          >
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); d.toggleSelect(id) }}
                              className={[
                                'w-5 h-5 rounded border flex items-center justify-center',
                                selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-700 text-transparent',
                              ].join(' ')}
                              title="Select"
                            >
                              ✓
                            </button>
                            {!unlocked ? <Lock className="w-4 h-4 text-gray-300" /> : <ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {safeRender(pickFirst(r, ['company_name', 'name', 'company']))}
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {safeRender(pickFirst(r, ['sector', 'industry']))} · {safeRender(pickFirst(r, ['hq_location', 'location']))}
                              </div>
                            </div>
                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{score}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeader title="Hot Deals" hint="Heat score blends intel and funding scale." right={<div className="text-xs text-gray-400">Top 6</div>} />
            <div className="mt-4 space-y-2">
              {hotDeals.length === 0 ? (
                <div className="h-44"><EmptyCard icon="🔥" title="No ranked deals yet" body="As rows appear, we compute a heat score for a demo-ready ranking panel." /></div>
              ) : (
                hotDeals.map((h, i) => {
                  const r: any = h.r
                  const id = String(r.id)
                  const unlocked = d.unlockedIds.has(id)
                  return (
                    <div key={id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                      <button type="button" onClick={() => d.setDrawerRow(r)} className="text-left min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200">#{i + 1}</span>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{safeRender(pickFirst(r, ['company_name', 'name']))}</div>
                          {!unlocked ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Locked</span> : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Unlocked</span>}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{bucketStage(asString(pickFirst(r, ['funding_stage', 'stage']), 'Unknown'))} · {safeRender(pickFirst(r, ['workflow_status', 'status']))}</div>
                      </button>
                      <div className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {Math.round(h.heat)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible table (secondary) */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">All Companies</div>
            <span className="text-xs text-gray-400">({filtered.length})</span>
          </div>
          <button
            type="button"
            onClick={() => setTableOpen(v => !v)}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
          >
            {tableOpen ? 'Hide table' : 'Open table'}
          </button>
        </div>

        {!tableOpen ? (
          <div className="p-6 text-sm text-gray-500">
            Table is collapsed by default to keep the dashboard analytics-first. Open it when you need raw rows.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 text-left">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" className="rounded" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Raised</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.slice(0, 120).map((r: any) => {
                  const id = String(r.id)
                  const unlocked = d.unlockedIds.has(id)
                  const selected = d.selectedIds.has(id)
                  return (
                    <tr
                      key={id}
                      className={['cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors', selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''].join(' ')}
                      onClick={() => d.setDrawerRow(r)}
                    >
                      <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); d.toggleSelect(id) }}>
                        <input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!unlocked ? <Lock className="w-3.5 h-3.5 text-gray-300" /> : null}
                          <div className="font-medium text-gray-900 dark:text-gray-100">{safeRender(pickFirst(r, ['company_name', 'name', 'company']))}</div>
                          {unlocked ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Unlocked</span> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">{bucketStage(asString(pickFirst(r, ['funding_stage', 'stage']), 'Unknown'))}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{safeRender(pickFirst(r, ['sector', 'industry']))}</td>
                      <td className="px-4 py-3 font-semibold">{unlocked ? safeRender(pickFirst(r, ['total_raised', 'raised'])) : <span className="text-gray-300 dark:text-gray-700">●●●●</span>}</td>
                      <td className="px-4 py-3">{safeRender(pickFirst(r, ['intelligence_score', 'score']))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
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
      />

      {d.drawerRow ? (
        <Drawer
          open={!!d.drawerRow}
          onClose={() => d.setDrawerRow(null)}
          title={asString(pickFirst(d.drawerRow as any, ['company_name', 'name', 'company']), 'Company')}
          isUnlocked={d.unlockedIds.has(String((d.drawerRow as any).id))}
          onUnlock={() => { d.toggleSelect(String((d.drawerRow as any).id)); d.handleUnlock() }}
          unlocking={d.unlocking}
          tabs={drawerTabs(d.drawerRow, d.unlockedIds.has(String((d.drawerRow as any).id)))}
        />
      ) : null}
    </div>
  )
}
