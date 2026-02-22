'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Lock, Shield, AlertTriangle, Activity, Eye } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.cyberintel
function postureColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}
export default function CyberIntelDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const avgPosture = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.security_posture_score) || 0), 0) / d.rows.length) : 0
  const totalBreaches = d.rows.reduce((s, r) => s + (Number(r.breach_count_12m) || 0), 0)
  const avgAttack = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.attack_surface_score) || 0), 0) / d.rows.length) : 0
  const criticalOrgs = d.rows.filter(r => Number(r.security_posture_score) < 50).length
  const breachData = d.rows.slice(0, 8).map(r => ({ name: String(r.organization_name || '').substring(0, 12), breaches: Number(r.breach_count_12m) || 0 }))
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Organization"><DrawerField label="Name" value={safeRender(row.organization_name)} /><DrawerField label="Industry" value={safeRender(row.industry)} /><DrawerField label="Employees" value={safeRender(row.employee_count)} /><DrawerField label="Posture Score" value={safeRender(row.security_posture_score)} /></DrawerSection></div> },
      { label: 'Attack Surface', content: <div className="space-y-4"><DrawerSection title="Exposure"><DrawerField label="Attack Surface Score" value={safeRender(row.attack_surface_score)} /><DrawerField label="Open Ports" value={safeRender(row.open_ports)} masked={m} /><DrawerField label="Exposed Services" value={safeRender(row.exposed_services)} masked={m} /></DrawerSection></div> },
      { label: 'CVEs', content: <div className="space-y-4"><DrawerSection title="Vulnerabilities"><DrawerField label="Critical CVEs" value={safeRender(row.critical_cve_count)} /><DrawerField label="High CVEs" value={safeRender(row.high_cve_count)} /><DrawerField label="CVE Details" value={safeRender(row.cve_details)} masked={m} /></DrawerSection></div> },
      { label: 'Breach History', content: <div className="space-y-4"><DrawerSection title="Breaches"><DrawerField label="Breaches (12m)" value={safeRender(row.breach_count_12m)} /><DrawerField label="Last Breach" value={safeRender(row.last_breach_date)} /><DrawerField label="Details" value={safeRender(row.breach_details)} masked={m} /></DrawerSection></div> },
    ]
  }
  return (
    <div className="bg-gray-950 text-white min-h-full p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1"><Shield className="w-5 h-5 text-emerald-400" /><h1 className="text-2xl font-bold text-white">Cybersecurity Intelligence</h1></div>
          <p className="text-sm text-gray-400">Security posture, CVEs and breach history</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 border border-emerald-700 rounded-xl">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /><span className="text-xs text-emerald-400 font-medium">LIVE INTEL</span>
        </div>
      </div>
      {d.error && <div className="bg-red-900/20 border border-red-700 rounded-xl p-4 text-sm text-red-400">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Security Posture', value: `${avgPosture}/100`, icon: <Shield className="w-4 h-4 text-emerald-400" />, color: postureColor(avgPosture) },
          { label: 'Total Breaches (12m)', value: totalBreaches, icon: <AlertTriangle className="w-4 h-4 text-red-400" />, color: '#ef4444' },
          { label: 'Avg Attack Surface', value: `${avgAttack}/100`, icon: <Eye className="w-4 h-4 text-amber-400" />, color: '#f59e0b' },
          { label: 'Critical Risk Orgs', value: criticalOrgs, icon: <AlertTriangle className="w-4 h-4 text-red-400" />, color: '#ef4444' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>{icon}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Breach Count by Organization</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={breachData}><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} /><YAxis tick={{ fontSize: 10, fill: '#6b7280' }} /><Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb', fontSize: 12 }} /><Bar dataKey="breaches" radius={[4, 4, 0, 0]}>{breachData.map((entry, i) => <Cell key={i} fill={entry.breaches > 2 ? '#ef4444' : entry.breaches > 0 ? '#f97316' : '#10b981'} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Threat Monitor</h3>
          <div className="space-y-2">{d.rows.slice(0, 7).map(row => {
            const posture = Number(row.security_posture_score) || 0
            const isHigh = posture < 50; const isMed = posture >= 50 && posture < 70
            return (
              <div key={String(row.id)} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-800/60">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isHigh ? 'bg-red-500 animate-pulse' : isMed ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-sm text-gray-200 flex-1 truncate">{safeRender(row.organization_name)}</span>
                <span className="text-xs text-gray-500 shrink-0">{safeRender(row.industry)}</span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded shrink-0 ${isHigh ? 'bg-red-900/40 text-red-400' : isMed ? 'bg-amber-900/40 text-amber-400' : 'bg-emerald-900/40 text-emerald-400'}`}>{posture}</span>
              </div>
            )
          })}</div>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300">Organizations ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-emerald-400 hover:text-emerald-300">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No records found.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-800/60 text-left">
              <th className="px-4 py-3 w-8"><input type="checkbox" className="accent-emerald-500" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posture</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attack Surface</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Breaches 12m</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const posture = Number(row.security_posture_score) || 0
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-800/40 ${selected ? 'bg-emerald-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} className="accent-emerald-500" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-600 shrink-0" />}<span className="font-medium text-gray-200">{safeRender(row.organization_name)}</span>{unlocked && <span className="text-[10px] text-emerald-500 bg-emerald-900/30 px-1.5 py-0.5 rounded-full">Unlocked</span>}</div></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{safeRender(row.industry)}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${posture}%`, background: postureColor(posture) }} /></div><span className="text-xs font-mono" style={{ color: postureColor(posture) }}>{posture}</span></div></td>
                    <td className="px-4 py-3">{unlocked ? <span className="text-xs font-mono text-amber-400">{safeRender(row.attack_surface_score)}</span> : <span className="text-gray-700 text-xs">●●●</span>}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-bold ${Number(row.breach_count_12m) > 0 ? 'text-red-400' : 'text-gray-600'}`}>{safeRender(row.breach_count_12m)}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.organization_name ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
