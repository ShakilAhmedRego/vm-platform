'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Lock, Building2, DollarSign, Clock, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.govintel
export default function GovIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const openOpps = d.rows.filter(r => r.status === 'open' || r.status === 'active').length
  const totalAward = d.rows.reduce((s, r) => s + (Number(r.award_amount) || 0), 0)
  const now = Date.now()
  const urgentCount = d.rows.filter(r => { if (!r.deadline) return false; const dl = new Date(String(r.deadline)).getTime(); return dl > now && dl - now < 30 * 86400000 }).length
  const agencyData = Array.from(d.rows.reduce((m, r) => { const a = String(r.agency || 'Unknown'); m.set(a, (m.get(a) || 0) + 1); return m }, new Map<string, number>())).map(([agency, count]) => ({ agency: agency.substring(0, 14), count })).sort((a, b) => b.count - a.count).slice(0, 7)
  const urgentRows = d.rows.filter(r => { if (!r.deadline) return false; const dl = new Date(String(r.deadline)).getTime(); return dl > now && dl - now < 30 * 86400000 }).sort((a, b) => new Date(String(a.deadline)).getTime() - new Date(String(b.deadline)).getTime()).slice(0, 6)
  function daysUntil(deadline: unknown) { if (!deadline) return null; const d = Math.ceil((new Date(String(deadline)).getTime() - now) / 86400000); return d >= 0 ? d : null }
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Opportunity"><DrawerField label="Title" value={safeRender(row.opportunity_title)} /><DrawerField label="Agency" value={safeRender(row.agency)} /><DrawerField label="Status" value={safeRender(row.status)} /><DrawerField label="Set-Aside" value={safeRender(row.set_aside)} /></DrawerSection></div> },
      { label: 'Procurement', content: <div className="space-y-4"><DrawerSection title="Details"><DrawerField label="NAICS Code" value={safeRender(row.naics_code)} /><DrawerField label="Award Amount" value={safeRender(row.award_amount)} masked={m} /><DrawerField label="Place of Performance" value={safeRender(row.place_of_performance)} /><DrawerField label="Contract Type" value={safeRender(row.contract_type)} /></DrawerSection></div> },
      { label: 'Timeline', content: <div className="space-y-4"><DrawerSection title="Key Dates"><DrawerField label="Posted Date" value={safeRender(row.posted_date)} /><DrawerField label="Deadline" value={safeRender(row.deadline)} /><DrawerField label="Award Date" value={safeRender(row.award_date)} /></DrawerSection></div> },
      { label: 'Awards', content: <div className="space-y-4"><DrawerSection title="Award Info"><DrawerField label="Awardee" value={safeRender(row.awardee_name)} masked={m} /><DrawerField label="Award Number" value={safeRender(row.award_number)} masked={m} /><DrawerField label="Modification" value={safeRender(row.modification_number)} /></DrawerSection></div> },
    ]
  }
  return (
    <div className="bg-gray-900 text-white min-h-full p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div><div className="flex items-center gap-2 mb-1"><Building2 className="w-5 h-5 text-blue-400" /><h1 className="text-2xl font-bold text-white">Government Contract Intelligence</h1></div><p className="text-sm text-gray-400">Federal and state procurement opportunities</p></div>
      </div>
      {d.error && <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-sm text-red-400">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Opportunities', value: openOpps || d.rows.length, icon: <FileText className="w-4 h-4 text-blue-400" />, color: '#60a5fa' },
          { label: 'Total Award Value', value: `$${(totalAward / 1e6).toFixed(0)}M`, icon: <DollarSign className="w-4 h-4 text-emerald-400" />, color: '#34d399' },
          { label: 'Closing in 30d', value: urgentCount, icon: <Clock className="w-4 h-4 text-amber-400" />, color: '#fbbf24' },
          { label: 'Agencies', value: agencyData.length, icon: <Building2 className="w-4 h-4 text-violet-400" />, color: '#a78bfa' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>{icon}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Opportunities by Agency</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agencyData} layout="vertical"><XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} /><YAxis type="category" dataKey="agency" tick={{ fontSize: 10, fill: '#9ca3af' }} width={90} /><Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} /><Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" />Deadline Urgency</h3>
          <div className="space-y-2.5">
            {urgentRows.length === 0 ? <p className="text-sm text-gray-500">No deadlines within 30 days.</p> : urgentRows.map(row => {
              const days = daysUntil(row.deadline)
              const isHot = days !== null && days <= 7
              return (
                <div key={String(row.id)} className="flex items-center gap-3 p-3 rounded-xl bg-gray-700/50">
                  <div className={`shrink-0 w-10 text-center`}>
                    <div className={`text-lg font-black ${isHot ? 'text-red-400' : 'text-amber-400'}`}>{days}</div>
                    <div className="text-[10px] text-gray-500">days</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{safeRender(row.opportunity_title)}</div>
                    <div className="text-xs text-gray-500">{safeRender(row.agency)}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${isHot ? 'bg-red-900/40 text-red-300' : 'bg-amber-900/40 text-amber-300'}`}>{isHot ? 'URGENT' : 'Soon'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300">Opportunities ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-blue-400 hover:text-blue-300">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No records found.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-700/50"><th className="px-4 py-3 w-8"><input type="checkbox" className="accent-blue-500" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Title</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Agency</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Award Amt</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Deadline</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-700">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const days = daysUntil(row.deadline)
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-700/30 ${selected ? 'bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} className="accent-blue-500" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-600 shrink-0" />}<span className="font-medium text-gray-200 truncate max-w-[220px]">{safeRender(row.opportunity_title)}</span>{unlocked && <span className="text-[10px] text-emerald-500 bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">✓</span>}</div></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{safeRender(row.agency)}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium text-sm">{unlocked && row.award_amount ? `$${(Number(row.award_amount) / 1e3).toFixed(0)}K` : <span className="text-gray-700">●●●</span>}</td>
                    <td className="px-4 py-3">{days !== null ? <span className={`text-xs font-medium ${days <= 7 ? 'text-red-400' : days <= 30 ? 'text-amber-400' : 'text-gray-400'}`}>{days}d</span> : <span className="text-gray-600 text-xs">—</span>}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${row.status === 'open' || row.status === 'active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>{safeRender(row.status)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.opportunity_title ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
