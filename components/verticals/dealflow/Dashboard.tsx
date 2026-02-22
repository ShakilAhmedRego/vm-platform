'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import KPICard from '../shared/KPICard'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Area, AreaChart, Legend
} from 'recharts'
import { Lock, TrendingUp, Building2, DollarSign, Zap, ArrowUpRight, Target } from 'lucide-react'
import type { ReactNode } from 'react'

const vertical = VERTICALS.dealflow
const STAGE_COLORS: Record<string, string> = {
  'Seed': '#818cf8', 'Series A': '#6366f1', 'Series B': '#4f46e5',
  'Series C': '#4338ca', 'Series D+': '#3730a3', 'Growth': '#a78bfa', 'Pre-seed': '#c4b5fd',
}

const MOCK_TREND = [
  { month: 'Aug', deals: 12, raised: 45 }, { month: 'Sep', deals: 18, raised: 78 },
  { month: 'Oct', deals: 15, raised: 62 }, { month: 'Nov', deals: 22, raised: 95 },
  { month: 'Dec', deals: 19, raised: 88 }, { month: 'Jan', deals: 28, raised: 124 },
]

export default function DealflowDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)

  const totalRaised = d.rows.reduce((s, r) => s + (Number(r.total_raised) || 0), 0)
  const activeDeals = d.rows.filter(r => r.workflow_status === 'active' || r.workflow_status === 'prospect').length
  const avgIntel = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.intelligence_score) || 0), 0) / d.rows.length) : 0
  const highIntel = d.rows.filter(r => Number(r.intelligence_score) >= 75).length

  const stageData = Object.entries(
    d.rows.reduce((acc, r) => {
      const stage = String(r.funding_stage || 'Unknown')
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([stage, count]) => ({ stage: stage.replace('Series ', 'S.'), count, fullStage: stage }))
    .sort((a, b) => b.count - a.count)

  const trendData = d.rows.length > 0 ? MOCK_TREND : []

  function drawerTabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      {
        label: 'Company', content: (
          <div className="space-y-5">
            <DrawerSection title="Profile">
              <DrawerField label="Company" value={safeRender(row.company_name)} />
              <DrawerField label="Sector" value={safeRender(row.sector)} />
              <DrawerField label="HQ Location" value={safeRender(row.hq_location)} />
              <DrawerField label="Founded" value={safeRender(row.founded_year)} />
            </DrawerSection>
            <DrawerSection title="Stage">
              <DrawerField label="Funding Stage" value={safeRender(row.funding_stage)} />
              <DrawerField label="Intel Score" value={safeRender(row.intelligence_score)} />
              <DrawerField label="Workflow" value={safeRender(row.workflow_status)} />
              <DrawerField label="Last Round" value={safeRender(row.last_round_date)} />
            </DrawerSection>
          </div>
        )
      },
      {
        label: 'Investors', content: (
          <div className="space-y-5">
            <DrawerSection title="Cap Table">
              <DrawerField label="Lead Investors" value={safeRender(row.lead_investors)} masked={m} />
              <DrawerField label="Investor Count" value={safeRender(row.investor_count)} masked={m} />
              <DrawerField label="Board Members" value={safeRender(row.board_members)} masked={m} />
            </DrawerSection>
          </div>
        )
      },
      {
        label: 'Financials', content: (
          <div className="space-y-5">
            <DrawerSection title="Metrics">
              <DrawerField label="Total Raised" value={row.total_raised ? `$${(Number(row.total_raised) / 1e6).toFixed(1)}M` : '—'} masked={m} />
              <DrawerField label="Valuation" value={row.valuation ? `$${(Number(row.valuation) / 1e6).toFixed(0)}M` : '—'} masked={m} />
              <DrawerField label="Revenue Est." value={row.revenue_estimate ? `$${(Number(row.revenue_estimate) / 1e6).toFixed(1)}M` : '—'} masked={m} />
            </DrawerSection>
          </div>
        )
      },
      {
        label: 'Pipeline', content: (
          <div className="space-y-5">
            <DrawerSection title="Workflow">
              <DrawerField label="Deal Owner" value={safeRender(row.deal_owner)} masked={m} />
              <DrawerField label="Next Action" value={safeRender(row.next_action)} masked={m} />
              <DrawerField label="Description" value={safeRender(row.description)} />
            </DrawerSection>
          </div>
        )
      },
    ]
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Investment Deal Flow</h1>
          <p className="text-sm text-gray-500 mt-0.5">VC/PE-backed companies and funding round intelligence</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <Target className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{d.rows.length} Companies</span>
        </div>
      </div>

      {d.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600 dark:text-red-400">
          {d.error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-indigo-200 uppercase tracking-wider">Total Raised</span>
            <DollarSign className="w-4 h-4 text-indigo-200" />
          </div>
          <div className="text-2xl font-bold">${(totalRaised / 1e6).toFixed(0)}M</div>
          <div className="flex items-center gap-1 mt-1 text-indigo-200 text-xs">
            <ArrowUpRight className="w-3 h-3" /> across all portfolio
          </div>
        </div>
        <KPICard label="Active Deals" value={activeDeals || d.rows.length} icon={<Building2 className="w-4 h-4" />} sub={`of ${d.rows.length} tracked`} trend="up" />
        <KPICard label="High Intel Score" value={highIntel} icon={<Zap className="w-4 h-4" />} sub="score ≥ 75" trend="up" />
        <KPICard label="Avg Intel Score" value={`${avgIntel}/100`} icon={<TrendingUp className="w-4 h-4" />} sub="signal quality" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Funding Stage Breakdown</h3>
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={stageData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={44} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stageData.map((entry, i) => (
                    <Cell key={i} fill={STAGE_COLORS[entry.fullStage] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">
              {d.loading ? 'Loading…' : 'No stage data yet'}
            </div>
          )}
        </div>

        {/* Activity trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Deal Activity Trend</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">+33% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="dealsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="raisedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="deals" stroke="#6366f1" strokeWidth={2} fill="url(#dealsGrad)" name="Deals" dot={{ r: 3 }} />
              <Area type="monotone" dataKey="raised" stroke="#8b5cf6" strokeWidth={2} fill="url(#raisedGrad)" name="Raised ($M)" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Intel score bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Companies Ranked by Intelligence Score</h3>
        <div className="space-y-2">
          {d.rows.slice(0, 8).map(row => {
            const score = Number(row.intelligence_score) || 0
            return (
              <div key={String(row.id)} className="flex items-center gap-3 group cursor-pointer" onClick={() => d.setDrawerRow(row)}>
                <span className="text-xs text-gray-500 w-32 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{safeRender(row.company_name)}</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: score >= 80 ? '#6366f1' : score >= 60 ? '#818cf8' : '#c4b5fd' }} />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 w-7 text-right">{score}</span>
                <span className="text-xs text-gray-400 w-20 truncate">{safeRender(row.funding_stage)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Portfolio Companies <span className="text-gray-400 font-normal ml-1">({d.rows.length})</span>
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{d.unlockedIds.size} unlocked</span>
            <button onClick={d.selectAll} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Select all</button>
          </div>
        </div>

        {d.loading ? (
          <div className="p-10 text-center text-sm text-gray-400 animate-pulse">Loading companies…</div>
        ) : d.rows.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm text-gray-500">No companies found. Run seed data in Supabase SQL Editor.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" className="rounded" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Raised</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intel Score</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {d.rows.map(row => {
                  const id = String(row.id)
                  const unlocked = d.unlockedIds.has(id)
                  const selected = d.selectedIds.has(id)
                  const score = Number(row.intelligence_score) || 0
                  return (
                    <tr
                      key={id}
                      onClick={() => d.setDrawerRow(row)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${selected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}>
                        <input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!unlocked && <Lock className="w-3 h-3 text-gray-300 shrink-0" />}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.company_name)}</div>
                            <div className="text-xs text-gray-400">{safeRender(row.hq_location)}</div>
                          </div>
                          {unlocked && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full ml-1">✓ Unlocked</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: (STAGE_COLORS[String(row.funding_stage)] || '#6366f1') + '20', color: STAGE_COLORS[String(row.funding_stage)] || '#6366f1' }}>
                          {safeRender(row.funding_stage)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{safeRender(row.sector)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        {unlocked ? (row.total_raised ? `$${(Number(row.total_raised) / 1e6).toFixed(1)}M` : '—') : <span className="text-gray-300 dark:text-gray-700 font-normal">●●●●</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${score}%`, background: STAGE_COLORS[String(row.funding_stage)] || '#6366f1' }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.workflow_status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          row.workflow_status === 'prospect' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {safeRender(row.workflow_status)}
                        </span>
                      </td>
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
        newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length}
        unlocking={d.unlocking}
        creditBalance={d.creditBalance}
        onUnlock={d.handleUnlock}
        onClear={d.clearSelection}
      />

      {d.drawerRow && (
        <Drawer
          open={!!d.drawerRow}
          onClose={() => d.setDrawerRow(null)}
          title={String(d.drawerRow.company_name ?? '—')}
          isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))}
          onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }}
          unlocking={d.unlocking}
          tabs={drawerTabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))}
        />
      )}
    </div>
  )
}
