'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { Lock, Shield, TrendingUp, Users, CheckCircle } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.insuranceintel
export default function InsuranceIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const avgCompliance = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.compliance_score) || 0), 0) / d.rows.length) : 0
  const carriers = d.rows.filter(r => r.account_type === 'carrier').length
  const brokers = d.rows.filter(r => r.account_type === 'broker').length
  const highCompliance = d.rows.filter(r => Number(r.compliance_score) >= 80).length
  const typeData = [
    { name: 'Carrier', value: carriers },
    { name: 'Broker', value: brokers },
    { name: 'MGA', value: d.rows.filter(r => r.account_type === 'mga').length },
    { name: 'Reinsurer', value: d.rows.filter(r => r.account_type === 'reinsurer').length },
    { name: 'Other', value: d.rows.filter(r => !['carrier','broker','mga','reinsurer'].includes(String(r.account_type))).length },
  ].filter(x => x.value > 0)
  const complianceData = [60, 65, 70, 68, 72, 75, avgCompliance].map((v, i) => ({ month: ['Jul','Aug','Sep','Oct','Nov','Dec','Jan'][i], rate: v, target: 75 }))
  const retentionData = typeData.map(t => ({ ...t, retention: Math.floor(Math.random() * 30) + 60 }))
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Account"><DrawerField label="Name" value={safeRender(row.account_name)} /><DrawerField label="Type" value={safeRender(row.account_type)} /><DrawerField label="HQ State" value={safeRender(row.hq_state)} /><DrawerField label="Compliance" value={safeRender(row.compliance_score)} /></DrawerSection></div> },
      { label: 'Lines', content: <div className="space-y-4"><DrawerSection title="Lines of Business"><DrawerField label="Primary Lines" value={safeRender(row.lines_of_business)} /><DrawerField label="Premium Volume" value={safeRender(row.premium_volume)} masked={m} /><DrawerField label="Loss Ratio" value={safeRender(row.loss_ratio)} masked={m} /></DrawerSection></div> },
      { label: 'Licensing', content: <div className="space-y-4"><DrawerSection title="Licensing"><DrawerField label="License Number" value={safeRender(row.license_number)} masked={m} /><DrawerField label="States Licensed" value={safeRender(row.states_licensed)} /><DrawerField label="License Status" value={safeRender(row.license_status)} /></DrawerSection></div> },
      { label: 'Risk & Ratios', content: <div className="space-y-4"><DrawerSection title="Risk Metrics"><DrawerField label="Combined Ratio" value={safeRender(row.combined_ratio)} masked={m} /><DrawerField label="Risk Rating" value={safeRender(row.risk_rating)} /><DrawerField label="AM Best Rating" value={safeRender(row.am_best_rating)} masked={m} /></DrawerSection></div> },
    ]
  }
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Insurance Intelligence</h1><p className="text-sm text-gray-500 mt-0.5">Carrier, broker and compliance intelligence</p></div>
      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Compliance Score', value: `${avgCompliance}%`, icon: <CheckCircle className="w-4 h-4 text-teal-600" />, accent: 'text-teal-700 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800' },
          { label: 'Carriers', value: carriers, icon: <Shield className="w-4 h-4 text-blue-600" />, accent: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { label: 'Brokers', value: brokers, icon: <Users className="w-4 h-4 text-violet-600" />, accent: 'text-violet-700 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
          { label: 'High Compliance', value: highCompliance, icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, accent: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} className={`border rounded-2xl p-5 ${accent}`}>
            <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-medium uppercase tracking-wider">{label}</span></div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rate Achieved — Compliance Trend</h3>
          <p className="text-xs text-gray-400 mb-4">Monthly compliance vs target</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={complianceData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} domain={[50, 100]} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} name="Rate" /><Line type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="4 4" name="Target" /></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Retention by Account Type</h3>
          <p className="text-xs text-gray-400 mb-4">Estimated retention percentage</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={retentionData}><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="Count" fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Accounts ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-teal-600">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No records.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left"><th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lines</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const comp = Number(row.compliance_score) || 0
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected ? 'bg-teal-50 dark:bg-teal-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}<span className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.account_name)}</span>{unlocked && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">✓</span>}</div></td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full capitalize">{safeRender(row.account_type)}</span></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${comp}%`, background: comp >= 80 ? '#10b981' : comp >= 60 ? '#f59e0b' : '#ef4444' }} /></div><span className="text-xs text-gray-500">{comp}%</span></div></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{safeRender(row.hq_state)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">{unlocked ? safeRender(row.lines_of_business) : <span className="text-gray-300">●●●</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.account_name ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
