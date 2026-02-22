'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Lock, Building2, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.realestateintel
const PIE_COLORS = ['#8b5cf6', '#a78bfa', '#6366f1', '#818cf8', '#c4b5fd', '#4f46e5']
export default function RealEstateIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const totalVal = d.rows.reduce((s, r) => s + (Number(r.valuation_estimate) || 0), 0)
  const avgRisk = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.risk_score) || 0), 0) / d.rows.length) : 0
  const debtFlags = d.rows.filter(r => r.debt_maturity_flag === true || r.debt_maturity_flag === 'true').length
  const typeData = Array.from(d.rows.reduce((m, r) => { const t = String(r.property_type || 'Unknown'); m.set(t, (m.get(t) || 0) + 1); return m }, new Map<string, number>())).map(([name, value]) => ({ name, value }))
  const valBands = [
    { band: '<$1M', count: d.rows.filter(r => Number(r.valuation_estimate) < 1e6).length },
    { band: '$1-5M', count: d.rows.filter(r => Number(r.valuation_estimate) >= 1e6 && Number(r.valuation_estimate) < 5e6).length },
    { band: '$5-20M', count: d.rows.filter(r => Number(r.valuation_estimate) >= 5e6 && Number(r.valuation_estimate) < 20e6).length },
    { band: '$20M+', count: d.rows.filter(r => Number(r.valuation_estimate) >= 20e6).length },
  ].filter(x => x.count > 0)
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Property"><DrawerField label="Name" value={safeRender(row.property_name)} /><DrawerField label="Type" value={safeRender(row.property_type)} /><DrawerField label="City" value={safeRender(row.city)} /><DrawerField label="State" value={safeRender(row.state)} /></DrawerSection></div> },
      { label: 'Ownership', content: <div className="space-y-4"><DrawerSection title="Ownership"><DrawerField label="Owner Name" value={safeRender(row.owner_name)} masked={m} /><DrawerField label="Entity Type" value={safeRender(row.entity_type)} /><DrawerField label="Owner Since" value={safeRender(row.ownership_date)} /></DrawerSection></div> },
      { label: 'Debt', content: <div className="space-y-4"><DrawerSection title="Debt"><DrawerField label="Loan Amount" value={safeRender(row.loan_amount)} masked={m} /><DrawerField label="Lender" value={safeRender(row.lender_name)} masked={m} /><DrawerField label="Maturity Date" value={safeRender(row.debt_maturity_date)} /><DrawerField label="Maturity Flag" value={safeRender(row.debt_maturity_flag)} /></DrawerSection></div> },
      { label: 'Valuation', content: <div className="space-y-4"><DrawerSection title="Valuation"><DrawerField label="Estimate" value={row.valuation_estimate ? `$${(Number(row.valuation_estimate)/1e6).toFixed(1)}M` : '—'} masked={m} /><DrawerField label="Risk Score" value={safeRender(row.risk_score)} /><DrawerField label="Cap Rate" value={safeRender(row.cap_rate)} masked={m} /></DrawerSection></div> },
    ]
  }
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-950 min-h-full">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Real Estate Intelligence</h1><p className="text-sm text-gray-500 mt-0.5">Property valuations, debt maturity and risk signals</p></div>
      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Portfolio Value', value: `$${(totalVal/1e9).toFixed(1)}B`, icon: <DollarSign className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
          { label: 'Avg Risk Score', value: `${avgRisk}/100`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { label: 'Debt Maturity Flags', value: debtFlags, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
          { label: 'Properties Tracked', value: d.rows.length, icon: <Building2 className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className={`border rounded-2xl p-5 ${bg}`}>
            <div className={`flex items-center gap-2 mb-2 ${color}`}>{icon}<span className="text-xs font-medium uppercase tracking-wider">{label}</span></div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Property Type Mix</h3>
          <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          <div className="mt-3 space-y-1">{typeData.slice(0,4).map((t, i) => <div key={t.name} className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-gray-600 dark:text-gray-400 flex-1">{t.name}</span><span className="font-medium text-gray-900 dark:text-gray-100">{t.value}</span></div>)}</div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Valuation Distribution</h3>
          <ResponsiveContainer width="100%" height={180}><BarChart data={valBands}><XAxis dataKey="band" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Properties ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-violet-600">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No records.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left"><th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valuation</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Debt Flag</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const risk = Number(row.risk_score) || 0
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected ? 'bg-violet-50 dark:bg-violet-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}<span className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.property_name)}</span>{unlocked && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">✓</span>}</div><div className="text-xs text-gray-400">{safeRender(row.city)}, {safeRender(row.state)}</div></td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">{safeRender(row.property_type)}</span></td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{unlocked && row.valuation_estimate ? `$${(Number(row.valuation_estimate)/1e6).toFixed(1)}M` : <span className="text-gray-400">●●●</span>}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${risk}%`, background: risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981' }} /></div><span className="text-xs text-gray-500">{risk}</span></div></td>
                    <td className="px-4 py-3">{row.debt_maturity_flag === true || row.debt_maturity_flag === 'true' ? <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">⚠ Flag</span> : <span className="text-xs text-gray-400">—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.property_name ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
