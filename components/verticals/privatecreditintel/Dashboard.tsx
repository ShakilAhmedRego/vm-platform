'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useVerticalData, safeRender } from '../shared/useVerticalData'
import { VERTICALS } from '@/lib/verticals'
import UnlockBar from '../shared/UnlockBar'
import Drawer, { DrawerField, DrawerSection } from '../shared/Drawer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Lock, TrendingDown, AlertCircle, DollarSign, BarChart3 } from 'lucide-react'
import type { ReactNode } from 'react'
const vertical = VERTICALS.privatecreditintel
function riskColor(score: number) { if (score <= 30) return '#10b981'; if (score <= 60) return '#f59e0b'; return '#ef4444' }
function RiskGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  const angle = -90 + (pct / 100) * 180
  const color = riskColor(pct)
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="65" viewBox="0 0 120 65">
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct/100)*157} 157`} />
        <g transform={`rotate(${angle} 60 60)`}><line x1="60" y1="60" x2="60" y2="18" stroke="#374151" strokeWidth="2" strokeLinecap="round" /></g>
        <circle cx="60" cy="60" r="4" fill="#374151" />
      </svg>
      <span className="text-2xl font-black -mt-1" style={{ color }}>{score}</span>
      <span className="text-xs text-gray-500">Risk Score</span>
    </div>
  )
}
export default function PrivateCreditDashboard() {
  const [userId, setUserId] = useState<string | undefined>()
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id)) }, [])
  const d = useVerticalData(vertical, userId)
  const avgRisk = d.rows.length ? Math.round(d.rows.reduce((s, r) => s + (Number(r.credit_risk_score) || 0), 0) / d.rows.length) : 0
  const delinquent = d.rows.filter(r => r.delinquency_flag === true || r.delinquency_flag === 'true').length
  const totalRevenue = d.rows.reduce((s, r) => s + (Number(r.revenue_estimate) || 0), 0)
  const highRisk = d.rows.filter(r => Number(r.credit_risk_score) > 70).length
  const riskBands = [
    { band: 'Low (0-30)', count: d.rows.filter(r => Number(r.credit_risk_score) <= 30).length, color: '#10b981' },
    { band: 'Med (31-60)', count: d.rows.filter(r => Number(r.credit_risk_score) > 30 && Number(r.credit_risk_score) <= 60).length, color: '#f59e0b' },
    { band: 'High (61+)', count: d.rows.filter(r => Number(r.credit_risk_score) > 60).length, color: '#ef4444' },
  ]
  function tabs(row: Record<string, unknown>, unlocked: boolean): { label: string; content: ReactNode }[] {
    const m = !unlocked
    return [
      { label: 'Overview', content: <div className="space-y-4"><DrawerSection title="Company"><DrawerField label="Name" value={safeRender(row.company_name)} /><DrawerField label="Industry" value={safeRender(row.industry)} /><DrawerField label="State" value={safeRender(row.state)} /><DrawerField label="Employees" value={safeRender(row.employee_count)} /></DrawerSection></div> },
      { label: 'Risk & Credit', content: <div className="space-y-4"><DrawerSection title="Credit"><DrawerField label="Risk Score" value={safeRender(row.credit_risk_score)} /><DrawerField label="Delinquency Flag" value={safeRender(row.delinquency_flag)} /><DrawerField label="Credit Rating" value={safeRender(row.credit_rating)} masked={m} /><DrawerField label="Days Past Due" value={safeRender(row.days_past_due)} masked={m} /></DrawerSection></div> },
      { label: 'UCC & Liens', content: <div className="space-y-4"><DrawerSection title="Liens"><DrawerField label="UCC Filings" value={safeRender(row.ucc_filing_count)} /><DrawerField label="Lien Amount" value={safeRender(row.lien_amount)} masked={m} /><DrawerField label="Collateral" value={safeRender(row.collateral_type)} masked={m} /></DrawerSection></div> },
      { label: 'Financials', content: <div className="space-y-4"><DrawerSection title="Financials"><DrawerField label="Revenue Est." value={row.revenue_estimate ? `$${(Number(row.revenue_estimate)/1e6).toFixed(1)}M` : '—'} masked={m} /><DrawerField label="Debt Load" value={safeRender(row.debt_load)} masked={m} /><DrawerField label="EBITDA Est." value={safeRender(row.ebitda_estimate)} masked={m} /></DrawerSection></div> },
    ]
  }
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Private Credit Intelligence</h1><p className="text-sm text-gray-500 mt-0.5">Credit risk, UCC liens and financial signals</p></div>
      {d.error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-600">{d.error}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center"><RiskGauge score={avgRisk} /></div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5"><div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Delinquent</div><div className="text-2xl font-bold text-red-600">{delinquent}</div><div className="text-xs text-gray-400 mt-1">of {d.rows.length} tracked</div></div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5"><div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Revenue Tracked</div><div className="text-2xl font-bold text-gray-900 dark:text-gray-100">${(totalRevenue/1e9).toFixed(1)}B</div><div className="text-xs text-gray-400 mt-1">estimated total</div></div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5"><div className="text-xs text-gray-500 uppercase tracking-wider mb-2">High Risk</div><div className="text-2xl font-bold text-amber-600">{highRisk}</div><div className="text-xs text-gray-400 mt-1">score above 70</div></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={riskBands}><XAxis dataKey="band" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" radius={[4,4,0,0]}>{riskBands.map((b, i) => <Cell key={i} fill={b.color} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Regulatory Parameters</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="px-3 py-2 text-xs font-semibold text-gray-500 text-left">Parameter</th><th className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">This Month</th><th className="px-3 py-2 text-xs font-semibold text-gray-500 text-right">Change</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {[{ param: 'Avg Credit Risk Score', val: avgRisk, change: '+2.1' }, { param: 'Delinquency Rate', val: `${d.rows.length ? ((delinquent/d.rows.length)*100).toFixed(1) : 0}%`, change: '-0.4%' }, { param: 'High Risk Concentration', val: `${d.rows.length ? ((highRisk/d.rows.length)*100).toFixed(1) : 0}%`, change: '+1.2%' }, { param: 'Revenue Coverage', val: `$${(totalRevenue/1e9).toFixed(1)}B`, change: '+5.6%' }].map(({ param, val, change }) => (
                <tr key={param}><td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{param}</td><td className="px-3 py-2.5 text-right font-semibold text-gray-900 dark:text-gray-100">{val}</td><td className={`px-3 py-2.5 text-right text-xs font-medium ${String(change).startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{change}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Companies ({d.rows.length})</h3>
          <button onClick={d.selectAll} className="text-xs text-amber-600 hover:text-amber-700">Select all</button>
        </div>
        {d.loading ? <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Loading…</div> : d.rows.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No records.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 text-left"><th className="px-4 py-3 w-8"><input type="checkbox" onChange={e => e.target.checked ? d.selectAll() : d.clearSelection()} /></th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Est.</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Delinquent</th><th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th></tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {d.rows.map(row => {
                const id = String(row.id); const unlocked = d.unlockedIds.has(id); const selected = d.selectedIds.has(id)
                const risk = Number(row.credit_risk_score) || 0
                return (
                  <tr key={id} onClick={() => d.setDrawerRow(row)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); d.toggleSelect(id) }}><input type="checkbox" checked={selected} onChange={() => d.toggleSelect(id)} /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2">{!unlocked && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}<span className="font-medium text-gray-900 dark:text-gray-100">{safeRender(row.company_name)}</span>{unlocked && <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">✓</span>}</div><div className="text-xs text-gray-400">{safeRender(row.state)}</div></td>
                    <td className="px-4 py-3 font-medium">{unlocked && row.revenue_estimate ? `$${(Number(row.revenue_estimate)/1e6).toFixed(0)}M` : <span className="text-gray-400">●●●</span>}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${risk}%`, background: riskColor(risk) }} /></div><span className="text-xs font-mono" style={{ color: riskColor(risk) }}>{risk}</span></div></td>
                    <td className="px-4 py-3">{row.delinquency_flag === true || row.delinquency_flag === 'true' ? <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Yes</span> : <span className="text-xs text-gray-400">No</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{safeRender(row.industry)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </div>
      <UnlockBar selectedCount={d.selectedIds.size} newCount={Array.from(d.selectedIds).filter(id => !d.unlockedIds.has(id)).length} unlocking={d.unlocking} creditBalance={d.creditBalance} onUnlock={d.handleUnlock} onClear={d.clearSelection} />
      {d.drawerRow && <Drawer open={!!d.drawerRow} onClose={() => d.setDrawerRow(null)} title={String(d.drawerRow.company_name ?? '—')} isUnlocked={d.unlockedIds.has(String(d.drawerRow.id))} onUnlock={() => { d.toggleSelect(String(d.drawerRow!.id)); d.handleUnlock() }} unlocking={d.unlocking} tabs={tabs(d.drawerRow, d.unlockedIds.has(String(d.drawerRow.id)))} />}
    </div>
  )
}
