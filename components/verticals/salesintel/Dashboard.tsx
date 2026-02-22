'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import KPICard from '../shared/KPICard'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { Lock, Users, Mail, Target, TrendingUp, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

const vertical = VERTICALS.salesintel
const MOCK_CPC = [
  { week: 'W1', cpc: 2.4, conv: 3.2 }, { week: 'W2', cpc: 2.1, conv: 4.1 },
  { week: 'W3', cpc: 2.8, conv: 3.7 }, { week: 'W4', cpc: 1.9, conv: 5.2 },
  { week: 'W5', cpc: 2.3, conv: 4.8 }, { week: 'W6', cpc: 1.7, conv: 6.1 },
]

export default function SalesIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)

  const highPriority = d.rows.filter(r => Number(r.priority_score) >= 80).length
  const verified = d.rows.filter(r => r.email_status === 'verified').length
  const avgIntel = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.intelligence_score) || 0), 0) / d.rows.length) : 0
  const withIntent = d.rows.filter(r => r.intent_signal && r.intent_signal !== 'none').length

  const funnelData = [
    { stage: 'New', count: d.rows.filter(r => r.workflow_status === 'new' || !r.workflow_status).length, color: '#94a3b8' },
    { stage: 'Contacted', count: d.rows.filter(r => r.workflow_status === 'contacted').length, color: '#60a5fa' },
    { stage: 'Qualified', count: d.rows.filter(r => r.workflow_status === 'qualified').length, color: '#a78bfa' },
    { stage: 'Proposal', count: d.rows.filter(r => r.workflow_status === 'proposal').length, color: '#f97316' },
    { stage: 'Closed', count: d.rows.filter(r => r.workflow_status === 'closed').length, color: '#ef4444' },
  ].filter(x => x.count > 0)

  const emailStatusData = [
    { name: 'Verified', value: d.rows.filter(r => r.email_status === 'verified').length, color: '#10b981' },
    { name: 'Valid', value: d.rows.filter(r => r.email_status === 'valid').length, color: '#3b82f6' },
    { name: 'Risky', value: d.rows.filter(r => r.email_status === 'risky').length, color: '#f59e0b' },
    { name: 'Unknown', value: d.rows.filter(r => !r.email_status || r.email_status === 'unknown').length, color: '#9ca3af' },
  ].filter(x => x.value > 0)

  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Lead', content: <div className="space-y-5"><DrawerSection title="Company"><DrawerField label="Company" value={safeRender(row.company)} /><DrawerField label="Title" value={safeRender(row.title)} /><DrawerField label="Industry" value={safeRender(row.industry)} /><DrawerField label="Employees" value={safeRender(row.employee_count)} /></DrawerSection></div> },
      { label: 'Contact', content: <div className="space-y-5"><DrawerSection title="Contact Info"><DrawerField label="Full Name" value={safeRender(row.full_name)} masked={m} /><DrawerField label="Email" value={safeRender(row.email)} masked={m} /><DrawerField label="Phone" value={safeRender(row.phone)} masked={m} /><DrawerField label="LinkedIn" value={safeRender(row.linkedin_url)} masked={m} /></DrawerSection></div> },
      { label: 'Signals', content: <div className="space-y-5"><DrawerSection title="Intelligence"><DrawerField label="Intel Score" value={safeRender(row.intelligence_score)} /><DrawerField label="Priority Score" value={safeRender(row.priority_score)} /><DrawerField label="Intent Signal" value={safeRender(row.intent_signal)} /><DrawerField label="Last Activity" value={safeRender(row.last_activity)} /></DrawerSection></div> },
      { label: 'Verification', content: <div className="space-y-5"><DrawerSection title="Email Quality"><DrawerField label="Email Status" value={safeRender(row.email_status)} /><DrawerField label="Bounce Risk" value={safeRender(row.bounce_risk)} /><DrawerField label="Verified At" value={safeRender(row.verified_at)} /></DrawerSection></div> },
    ]
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sales Intelligence</h1>
          <p className="text-sm text-gray-500 mt-0.5">B2B leads with verified contact signals and intent data</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <Zap className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">{withIntent} Intent Signals</span>
        </div>
      </div>

      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg shadow-red-200 dark:shadow-none">
          <div className="text-xs font-medium text-red-100 uppercase tracking-wider mb-3">Total Leads</div>
          <div className="text-3xl font-bold">{d.rows.length}</div>
          <div className="text-red-200 text-xs mt-1">in database</div>
        </div>
        <KPICard label="High Priority" value={highPriority} icon={<Target className="w-4 h-4" />} sub="score ≥ 80" trend="up" />
        <KPICard label="Verified Emails" value={verified} icon={<Mail className="w-4 h-4" />} sub={`of ${d.rows.length} total`} />
        <KPICard label="Avg Intel Score" value={`${avgIntel}/100`} icon={<TrendingUp className="w-4 h-4" />} sub="signal strength" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Workflow Funnel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnelData}>
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Email Quality Breakdown</h3>
          <div className="space-y-3 mt-2">
            {emailStatusData.map(({ name, value, color }) => {
              const pct = d.rows.length ? Math.round(value / d.rows.length * 100) : 0
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{name}</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">CPC & Conversion Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={MOCK_CPC}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Line type="monotone" dataKey="cpc" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="CPC ($)" />
              <Line type="monotone" dataKey="conv" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Conv (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">B2B Leads <span className="text-gray-400 font-normal ml-1">({d.rows.length})</span></h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{d.unlockedIds.size} unlocked</span>
            <button onClick={d.selectAll} className="text-xs text-red-600 hover:text-red-700 font-medium">Select all</button>
          </div>
        </div>
        {d.loading ? <div className="p-10 text-center text-sm text-gray-400 animate-pulse">Loading leads…</div> : d.rows.length === 0 ? (
          <div className="p-10 text-center"><div className="text-2xl mb-2">🎯</div><div className="text-sm text-gray-500">No leads found. Run seed data in Supabase.</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                <th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company / Contact</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employees</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intent</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                {d.rows.map(row => {
                  const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                  const priority = Number(row.priority_score) || 0
                  const emailColors: Record<string, string> = { verified: 'bg-emerald-50 text-emerald-700', valid: 'bg-blue-50 text-blue-700', risky: 'bg-amber-50 text-amber-700', unknown: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${selected ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {!unlocked && <Lock className="w-3 h-3 text-gray-300 shrink-0" />}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.company)}</div>
                            <div className="text-xs text-gray-400">{unlocked ? safeRender(row.full_name) : '●●●●●●'}</div>
                          </div>
                          {unlocked && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">✓</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{safeRender(row.title)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emailColors[String(row.email_status)] || 'bg-gray-100 text-gray-600'}`}>
                          {safeRender(row.email_status) || 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{safeRender(row.employee_count)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${priority}%`, background: priority >= 80 ? '#ef4444' : priority >= 60 ? '#f97316' : '#94a3b8' }} />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{priority}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.intent_signal && row.intent_signal !== 'none' ? (
                          <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-medium">
                            {safeRender(row.intent_signal)}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.company ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
