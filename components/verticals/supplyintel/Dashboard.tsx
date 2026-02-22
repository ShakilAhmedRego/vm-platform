'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Lock, AlertTriangle, CheckCircle, Globe, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.supplyintel
const DONUT_COLORS = ['#10b981','#f59e0b','#ef4444','#6b7280']
export default function SupplyIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const highRisk = d.rows.filter(r => Number(r.risk_score) >= 70).length
  const avgRisk = d.rows.length ? (d.rows.reduce((s, r) => s + (Number(r.risk_score) || 0), 0) / d.rows.length).toFixed(1) : '0'
  const compliant = d.rows.filter(r => r.compliance_status === 'compliant').length
  const compliancePct = d.rows.length ? Math.round(compliant / d.rows.length * 100) : 0
  const riskPieData = [
    { name: 'Low', value: d.rows.filter(r => Number(r.risk_score) < 40).length },
    { name: 'Med', value: d.rows.filter(r => Number(r.risk_score) >= 40 && Number(r.risk_score) < 70).length },
    { name: 'High', value: highRisk },
    { name: 'Unknown', value: d.rows.filter(r => !r.risk_score).length },
  ].filter(x => x.value > 0)
  const countryData = Array.from(d.rows.reduce((m, r) => { const c = String(r.country || 'Unknown'); m.set(c, (m.get(c) || 0) + 1); return m }, new Map<string, number>())).map(([country, count]) => ({ country: country.substring(0, 14), count })).sort((a, b) => b.count - a.count).slice(0, 7)
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Supplier"><DrawerField label="Name" value={safeRender(row.supplier_name)} /><DrawerField label="Country" value={safeRender(row.country)} /><DrawerField label="Category" value={safeRender(row.category)} /><DrawerField label="Risk Score" value={safeRender(row.risk_score)} /></DrawerSection></div> },
      { label: 'Risk', content: <div className="space-y-4"><DrawerSection title="Risk Factors"><DrawerField label="Risk Score" value={safeRender(row.risk_score)} /><DrawerField label="Risk Category" value={safeRender(row.risk_category)} /><DrawerField label="Geopolitical Risk" value={safeRender(row.geopolitical_risk)} /><DrawerField label="Financial Risk" value={safeRender(row.financial_risk)} masked={m} /></DrawerSection></div> },
      { label: 'Logistics', content: <div className="space-y-4"><DrawerSection title="Logistics"><DrawerField label="Lead Time (days)" value={safeRender(row.lead_time_days)} /><DrawerField label="Delivery Score" value={safeRender(row.delivery_score)} /><DrawerField label="Contact" value={safeRender(row.contact_email)} masked={m} /></DrawerSection></div> },
      { label: 'Certifications', content: <div className="space-y-4"><DrawerSection title="Compliance"><DrawerField label="Compliance Status" value={safeRender(row.compliance_status)} /><DrawerField label="ISO Certified" value={safeRender(row.iso_certified)} /><DrawerField label="Certifications" value={safeRender(row.certifications)} /></DrawerSection></div> },
    ]
  }
  const kpiItems = [
    { label: 'Perfect Order %', value: `${compliancePct}%`, sub: 'compliance rate', icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
    { label: 'Accurate Delivery %', value: `${d.rows.length ? Math.round(d.rows.filter(r => r.delivery_score && Number(r.delivery_score) >= 80).length / d.rows.length * 100) : 0}%`, sub: 'on-time score', icon: <CheckCircle className="w-4 h-4 text-blue-500" /> },
    { label: 'High Risk Suppliers', value: highRisk, sub: 'score ≥ 70', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
    { label: 'Avg Risk Score', value: avgRisk, sub: 'across all', icon: <ShieldAlert className="w-4 h-4 text-amber-500" /> },
    { label: 'Countries', value: countryData.length, sub: 'represented', icon: <Globe className="w-4 h-4 text-violet-500" /> },
  ]
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Supply Chain Intelligence</h1><p className="text-sm text-gray-500 mt-0.5">Supplier risk, logistics and compliance signals</p></div>
      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {kpiItems.map(({ label, value, sub, icon }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex-shrink-0 min-w-[140px]">
            <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-xs text-gray-500 font-medium">{label}</span></div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={riskPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>{riskPieData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-1">{riskPieData.map((item, i) => <div key={item.name} className="flex items-center gap-1.5 text-xs"><div className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} /><span className="text-gray-500">{item.name}</span><span className="font-medium text-gray-900 dark:text-gray-100 ml-auto">{item.value}</span></div>)}</div>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Suppliers by Country</h3>
          <ResponsiveContainer width="100%" height={180}><BarChart data={countryData} layout="vertical"><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="country" tick={{ fontSize: 10 }} width={80} /><Tooltip /><Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Suppliers ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-orange-600">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No records.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left"><th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const risk = Number(row.risk_score) || 0
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}<span className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.supplier_name)}</span>{unlocked && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">✓</span>}</div></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{safeRender(row.country)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${risk}%`, background: risk >= 70 ? '#ef4444' : risk >= 40 ? '#f59e0b' : '#10b981' }} /></div><span className="text-xs font-mono text-gray-600 dark:text-gray-400">{risk}</span></div></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${row.compliance_status === 'compliant' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{safeRender(row.compliance_status)}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{safeRender(row.category)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.supplier_name ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
